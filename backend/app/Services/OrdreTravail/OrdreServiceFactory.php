<?php

namespace App\Services\OrdreTravail;

use App\Models\OrdreTravail;
use App\Models\Configuration;
use App\Services\Facture\FactureServiceFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Factory/Router principal pour les services OrdreTravail.
 * Route vers le service spécialisé selon le type de document.
 */
class OrdreServiceFactory
{
    protected OrdreConteneursService $conteneursService;
    protected OrdreConventionnelService $conventionnelService;
    protected OrdreIndependantService $independantService;

    public function __construct(
        OrdreConteneursService $conteneursService,
        OrdreConventionnelService $conventionnelService,
        OrdreIndependantService $independantService
    ) {
        $this->conteneursService = $conteneursService;
        $this->conventionnelService = $conventionnelService;
        $this->independantService = $independantService;
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

            Log::info('Ordre créé via Factory', [
                'ordre_id' => $ordre->id,
                'numero' => $ordre->numero,
                'categorie' => $categorie,
            ]);

            return $ordre->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Modifier un ordre existant
     */
    public function modifier(OrdreTravail $ordre, array $data): OrdreTravail
    {
        return DB::transaction(function () use ($ordre, $data) {
            $categorie = $ordre->categorie;
            $service = $this->getService($categorie);

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

            Log::info('Ordre modifié via Factory', ['ordre_id' => $ordre->id]);

            return $ordre->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
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
                'armateur_id' => $ordre->armateur_id,
                'transitaire_id' => $ordre->transitaire_id,
                'representant_id' => $ordre->representant_id,
                'type_document' => $ordre->type_document,
                'categorie' => $categorie,
                'bl_numero' => $ordre->numero_bl,
                'navire' => $ordre->navire,
                'date_arrivee' => $ordre->date_arrivee,
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
