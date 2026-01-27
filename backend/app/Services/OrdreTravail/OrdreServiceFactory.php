<?php

namespace App\Services\OrdreTravail;

use App\Models\OrdreTravail;
use App\Models\Configuration;
use App\Models\Prime;
use App\Services\Facture\FactureServiceFactory;
use App\Services\LogistigaApiService;
use App\Traits\CalculeTaxesTrait;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Factory/Router principal pour les services OrdreTravail.
 * Route vers le service spécialisé selon le type de document.
 */
class OrdreServiceFactory
{
    use CalculeTaxesTrait;
    protected OrdreConteneursService $conteneursService;
    protected OrdreConventionnelService $conventionnelService;
    protected OrdreIndependantService $independantService;
    protected LogistigaApiService $logistigaService;

    public function __construct(
        OrdreConteneursService $conteneursService,
        OrdreConventionnelService $conventionnelService,
        OrdreIndependantService $independantService,
        LogistigaApiService $logistigaService
    ) {
        $this->conteneursService = $conteneursService;
        $this->conventionnelService = $conventionnelService;
        $this->independantService = $independantService;
        $this->logistigaService = $logistigaService;
    }

    /**
     * Obtenir le service approprié selon la catégorie
     */
    public function getService(string $categorie): OrdreConteneursService|OrdreConventionnelService|OrdreIndependantService
    {
        return match ($categorie) {
            'conteneurs', 'Conteneur' => $this->conteneursService,
            'conventionnel', 'Lot' => $this->conventionnelService,
            'operations_independantes', 'Independant' => $this->independantService,
            default => $this->conteneursService,
        };
    }

    /**
     * Normaliser les données entrantes de l'API
     */
    public function normaliserDonnees(array $data): array
    {
        // type_document (API) -> categorie (DB)
        if (!isset($data['categorie']) && isset($data['type_document'])) {
            $data['categorie'] = match ($data['type_document']) {
                'Conteneur' => 'conteneurs',
                'Lot' => 'conventionnel',
                'Independant' => 'operations_independantes',
                default => 'conteneurs',
            };
        }

        // bl_numero (API) -> numero_bl (DB)
        if (isset($data['bl_numero']) && !isset($data['numero_bl'])) {
            $data['numero_bl'] = $data['bl_numero'];
        }
        unset($data['bl_numero'], $data['type_document']);

        // Date par défaut (API peut envoyer "date" ou "date_creation")
        $dateCreation = $data['date_creation'] ?? null;
        $date = $data['date'] ?? null;

        if (!empty($dateCreation)) {
            // OK
        } elseif (!empty($date)) {
            $data['date_creation'] = $date;
        } else {
            $data['date_creation'] = now()->toDateString();
        }

        unset($data['date']);

        return $data;
    }

    /**
     * Créer un nouvel ordre de travail avec le service approprié
     */
    public function creer(array $data): OrdreTravail
    {
        return DB::transaction(function () use ($data) {
            $data = $this->normaliserDonnees($data);
            $categorie = $data['categorie'] ?? 'conteneurs';

            // Générer le numéro
            $data['numero'] = $this->genererNumero();
            $data['statut'] = $data['statut'] ?? 'en_cours';
            $data['montant_paye'] = 0;
            
            // Ajouter l'utilisateur créateur
            $data['created_by'] = auth()->id();

            // Extraire les primes avant l'insert
            $primeTransitaire = $data['prime_transitaire'] ?? 0;
            $primeRepresentant = $data['prime_representant'] ?? 0;
            unset($data['prime_transitaire'], $data['prime_representant']);

            // Extraire les relations avant l'insert
            $lignes = $data['lignes'] ?? [];
            $conteneurs = $data['conteneurs'] ?? [];
            $lots = $data['lots'] ?? [];
            unset($data['lignes'], $data['conteneurs'], $data['lots']);

            // Créer l'ordre
            $ordre = OrdreTravail::create($data);

            // Créer les éléments selon le type
            $service = $this->getService($categorie);

            if ($categorie === 'conteneurs' && !empty($conteneurs)) {
                $this->conteneursService->creerConteneurs($ordre, $conteneurs);
            } elseif ($categorie === 'conventionnel' && !empty($lots)) {
                $this->conventionnelService->creerLots($ordre, $lots);
            } elseif ($categorie === 'operations_independantes' && !empty($lignes)) {
                $this->independantService->creerLignes($ordre, $lignes);
            }

            // Calculer les totaux avec le bon service
            $service->calculerTotaux($ordre);

            // Créer les primes si présentes
            $this->creerPrimes($ordre, $primeTransitaire, $primeRepresentant);

            // Agréger les taxes pour les angles mensuels
            $this->agregerTaxesDocument($ordre, 'ordre');

            Log::info('Ordre créé via Factory', [
                'ordre_id' => $ordre->id,
                'numero' => $ordre->numero,
                'categorie' => $categorie,
            ]);

            $ordreFrais = $ordre->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur', 'primes']);

            // ENVOI AUTOMATIQUE VERS LOGISTIGA pour les ordres conteneurs
            if ($categorie === 'conteneurs') {
                $this->envoyerVersLogistiga($ordreFrais);
            }

            // ENVOI AUTOMATIQUE VERS LOGISTIGA pour les ordres conventionnels
            if ($categorie === 'conventionnel') {
                $this->envoyerLotsVersLogistiga($ordreFrais);
            }

            return $ordreFrais;
        });
    }

    /**
     * Envoyer automatiquement un ordre conteneur vers Logistiga
     */
    protected function envoyerVersLogistiga(OrdreTravail $ordre): void
    {
        try {
            $data = $this->logistigaService->prepareOrdreData($ordre);

            if (!$data) {
                Log::info('[Logistiga] Ordre non éligible (pas de BL ou conteneurs)', [
                    'ordre_id' => $ordre->id,
                    'numero' => $ordre->numero,
                ]);
                return;
            }

            $result = $this->logistigaService->sendOrdreTravail($data);

            if ($result['success'] ?? false) {
                $ordre->update(['logistiga_synced_at' => now()]);

                Log::info('[Logistiga] Ordre envoyé automatiquement', [
                    'ordre_id' => $ordre->id,
                    'numero' => $ordre->numero,
                    'logistiga_numero' => $result['data']['numero'] ?? null,
                ]);
                return;
            }

            Log::warning('[Logistiga] Échec envoi automatique', [
                'ordre_id' => $ordre->id,
                'numero' => $ordre->numero,
                'message' => $result['message'] ?? 'Erreur inconnue',
            ]);
        } catch (\Throwable $e) {
            // Ne pas bloquer la création de l'ordre si Logistiga échoue
            Log::error('[Logistiga] Exception lors de l\'envoi automatique', [
                'ordre_id' => $ordre->id,
                'numero' => $ordre->numero,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Envoyer automatiquement les lots conventionnels vers Logistiga
     */
    protected function envoyerLotsVersLogistiga(OrdreTravail $ordre): void
    {
        try {
            $result = $this->logistigaService->sendLotsConventionnels($ordre);

            if ($result['success'] ?? false) {
                $ordre->update(['logistiga_synced_at' => now()]);

                Log::info('[Logistiga] Lots conventionnels envoyés', [
                    'ordre_id' => $ordre->id,
                    'numero' => $ordre->numero,
                    'nb_lots' => $ordre->lots->count(),
                ]);
                return;
            }

            Log::warning('[Logistiga] Échec envoi lots conventionnels', [
                'ordre_id' => $ordre->id,
                'numero' => $ordre->numero,
                'message' => $result['message'] ?? 'Erreur inconnue',
            ]);
        } catch (\Throwable $e) {
            // Ne pas bloquer la création de l'ordre si Logistiga échoue
            Log::error('[Logistiga] Exception lors de l\'envoi des lots', [
                'ordre_id' => $ordre->id,
                'numero' => $ordre->numero,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Créer les primes pour transitaire et représentant
     */
    protected function creerPrimes(OrdreTravail $ordre, float $primeTransitaire, float $primeRepresentant): void
    {
        // Prime pour le transitaire
        if ($primeTransitaire > 0 && !empty($ordre->transitaire_id)) {
            Prime::create([
                'ordre_id' => $ordre->id,
                'transitaire_id' => $ordre->transitaire_id,
                'montant' => $primeTransitaire,
                'statut' => 'En attente',
                'description' => "Prime transitaire pour ordre {$ordre->numero}",
            ]);
            
            Log::info('Prime transitaire créée', [
                'ordre_id' => $ordre->id,
                'transitaire_id' => $ordre->transitaire_id,
                'montant' => $primeTransitaire,
            ]);
        }

        // Prime pour le représentant
        if ($primeRepresentant > 0 && !empty($ordre->representant_id)) {
            Prime::create([
                'ordre_id' => $ordre->id,
                'representant_id' => $ordre->representant_id,
                'montant' => $primeRepresentant,
                'statut' => 'En attente',
                'description' => "Prime représentant pour ordre {$ordre->numero}",
            ]);
            
            Log::info('Prime représentant créée', [
                'ordre_id' => $ordre->id,
                'representant_id' => $ordre->representant_id,
                'montant' => $primeRepresentant,
            ]);
        }
    }

    /**
     * Modifier un ordre existant
     */
    public function modifier(OrdreTravail $ordre, array $data): OrdreTravail
    {
        return DB::transaction(function () use ($ordre, $data) {
            $categorie = $ordre->categorie;
            $service = $this->getService($categorie);

            // Sauvegarder l'état avant modification pour recalcul des taxes
            $ancienEtat = clone $ordre;

            // Extraire les primes avant l'update (elles ne sont pas des colonnes de la table)
            $primeTransitaire = $data['prime_transitaire'] ?? null;
            $primeRepresentant = $data['prime_representant'] ?? null;
            unset($data['prime_transitaire'], $data['prime_representant']);

            $ordre->update($data);

            // Remplacer les conteneurs si fournis
            if (isset($data['conteneurs']) && $categorie === 'conteneurs') {
                foreach ($ordre->conteneurs as $conteneur) {
                    $conteneur->operations()->delete();
                }
                $ordre->conteneurs()->delete();
                $this->conteneursService->creerConteneurs($ordre, $data['conteneurs']);
            }

            // Remplacer les lots si fournis
            if (isset($data['lots']) && $categorie === 'conventionnel') {
                $ordre->lots()->delete();
                $this->conventionnelService->creerLots($ordre, $data['lots']);
            }

            // Remplacer les lignes si fournies
            if (isset($data['lignes']) && $categorie === 'operations_independantes') {
                $ordre->lignes()->delete();
                $this->independantService->creerLignes($ordre, $data['lignes']);
            }

            // Recalculer les totaux
            $service->calculerTotaux($ordre);

            // Gérer les primes (supprimer les anciennes non payées et créer les nouvelles)
            if ($primeTransitaire !== null || $primeRepresentant !== null) {
                $this->mettreAJourPrimes($ordre, $primeTransitaire ?? 0, $primeRepresentant ?? 0);
            }

            // Recalculer les taxes (retirer ancien état, ajouter nouveau)
            $this->recalculerTaxesDocument($ancienEtat, $ordre->fresh(), 'ordre');

            // SYNCHRONISATION AUTOMATIQUE : Si l'ordre est facturé, mettre à jour la facture associée
            $ordre->load('facture');
            if ($ordre->facture) {
                $this->synchroniserFacture($ordre, $data);
            }

            Log::info('Ordre modifié via Factory', ['ordre_id' => $ordre->id]);

            return $ordre->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur', 'facture', 'primes']);
        });
    }

    /**
     * Mettre à jour les primes d'un ordre (supprimer les anciennes non payées et créer les nouvelles)
     */
    protected function mettreAJourPrimes(OrdreTravail $ordre, float $primeTransitaire, float $primeRepresentant): void
    {
        // Supprimer les anciennes primes non payées de cet ordre
        Prime::where('ordre_id', $ordre->id)
            ->where('statut', 'En attente')
            ->delete();

        // Créer les nouvelles primes
        $this->creerPrimes($ordre, $primeTransitaire, $primeRepresentant);

        Log::info('Primes mises à jour pour ordre', [
            'ordre_id' => $ordre->id,
            'prime_transitaire' => $primeTransitaire,
            'prime_representant' => $primeRepresentant,
        ]);
    }

    /**
     * Synchroniser la facture associée avec les données de l'ordre
     */
    protected function synchroniserFacture(OrdreTravail $ordre, array $data): void
    {
        $facture = $ordre->facture;
        $factureFactory = app(FactureServiceFactory::class);
        $categorie = $ordre->categorie;

        // Préparer les données de mise à jour de la facture
        $factureData = [
            'client_id' => $ordre->client_id,
            'armateur_id' => $ordre->armateur_id,
            'transitaire_id' => $ordre->transitaire_id,
            'representant_id' => $ordre->representant_id,
            'type_operation' => $ordre->type_operation,
            'type_operation_indep' => $ordre->type_operation_indep,
            'numero_bl' => $ordre->numero_bl,
            'navire' => $ordre->navire,
            'notes' => $ordre->notes,
        ];

        // Synchroniser les éléments selon le type
        if ($categorie === 'conteneurs' && isset($data['conteneurs'])) {
            $factureData['conteneurs'] = $data['conteneurs'];
        } elseif ($categorie === 'conventionnel' && isset($data['lots'])) {
            $factureData['lots'] = $data['lots'];
        } elseif ($categorie === 'operations_independantes' && isset($data['lignes'])) {
            $factureData['lignes'] = $data['lignes'];
        } else {
            // Copier les éléments existants de l'ordre vers la facture
            $service = $this->getService($categorie);
            $factureData = array_merge($factureData, $service->preparerPourConversion($ordre));
        }

        // Mettre à jour la facture
        $factureFactory->modifier($facture, $factureData);

        Log::info('Facture synchronisée avec ordre', [
            'ordre_id' => $ordre->id,
            'facture_id' => $facture->id,
            'facture_numero' => $facture->numero,
        ]);
    }

    /**
     * Convertir un ordre de travail en facture
     */
    public function convertirEnFacture(OrdreTravail $ordre): \App\Models\Facture
    {
        return DB::transaction(function () use ($ordre) {
            $categorie = $ordre->categorie;
            $service = $this->getService($categorie);

            $factureFactory = app(FactureServiceFactory::class);

            $factureData = [
                'client_id' => $ordre->client_id,
                'ordre_id' => $ordre->id,
                'date_creation' => $ordre->date_creation?->toDateString() ?? now()->toDateString(),
                'armateur_id' => $ordre->armateur_id,
                'transitaire_id' => $ordre->transitaire_id,
                'representant_id' => $ordre->representant_id,
                'categorie' => $categorie,
                'type_operation' => $ordre->type_operation,
                'type_operation_indep' => $ordre->type_operation_indep,
                'numero_bl' => $ordre->numero_bl,
                'navire' => $ordre->navire,
                'notes' => $ordre->notes,
                'statut' => 'brouillon',
            ];

            // Ajouter les éléments spécifiques au type
            $factureData = array_merge($factureData, $service->preparerPourConversion($ordre));

            $facture = $factureFactory->creer($factureData);

            $ordre->update(['statut' => 'facture']);

            Log::info('Ordre converti en facture via Factory', [
                'ordre_id' => $ordre->id,
                'facture_id' => $facture->id,
                'categorie' => $categorie,
            ]);

            return $facture;
        });
    }

    /**
     * Enregistrer un paiement sur un ordre
     */
    public function enregistrerPaiement(OrdreTravail $ordre, float $montant): void
    {
        $nouveauMontantPaye = $ordre->montant_paye + $montant;
        
        $statut = $ordre->statut;
        if ($nouveauMontantPaye >= $ordre->montant_ttc && $ordre->statut !== 'facture') {
            $statut = 'termine';
        }

        $ordre->update([
            'montant_paye' => $nouveauMontantPaye,
            'statut' => $statut,
        ]);

        Log::info('Paiement enregistré sur ordre', [
            'ordre_id' => $ordre->id,
            'montant' => $montant,
        ]);
    }

    /**
     * Dupliquer un ordre de travail
     */
    public function dupliquer(OrdreTravail $ordre): OrdreTravail
    {
        $data = $ordre->toArray();
        unset($data['id'], $data['numero'], $data['devis_id'], $data['created_at'], $data['updated_at']);
        
        $data['lignes'] = $ordre->lignes->toArray();
        $data['conteneurs'] = $ordre->conteneurs->map(function ($c) {
            $arr = $c->toArray();
            $arr['operations'] = $c->operations->toArray();
            return $arr;
        })->toArray();
        $data['lots'] = $ordre->lots->toArray();
        $data['statut'] = 'en_cours';
        $data['montant_paye'] = 0;

        return $this->creer($data);
    }

    /**
     * Générer un numéro d'ordre unique
     */
    protected function genererNumero(): string
    {
        $annee = date('Y');
        
        return DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();
            
            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'],
                ]);
            }
            
            $prefixe = $config->data['prefixe_ordre'] ?? 'OT';

            // Trouver le numéro maximum existant
            $maxNumero = OrdreTravail::withTrashed()
                ->where('numero', 'like', $prefixe . '-' . $annee . '-%')
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = ($maxNumero ?? 0) + 1;

            // S'assurer que le numéro est au moins égal au compteur stocké
            $compteurStocke = $config->data['prochain_numero_ordre'] ?? 1;
            if ($prochainNumero < $compteurStocke) {
                $prochainNumero = $compteurStocke;
            }

            // Vérifier l'unicité
            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            while (OrdreTravail::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            // Mettre à jour le compteur
            $data = $config->data;
            $data['prochain_numero_ordre'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return $numero;
        });
    }
}
