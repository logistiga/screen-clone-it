<?php

namespace App\Services\Facture;

use App\Models\Facture;
use App\Models\Client;
use App\Models\Configuration;
use App\Models\Prime;
use App\Traits\CalculeTaxesTrait;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Factory/Router principal pour les services Facture.
 * Route vers le service spécialisé selon le type de document.
 */
class FactureServiceFactory
{
    use CalculeTaxesTrait;
    protected FactureConteneursService $conteneursService;
    protected FactureConventionnelService $conventionnelService;
    protected FactureIndependantService $independantService;

    public function __construct(
        FactureConteneursService $conteneursService,
        FactureConventionnelService $conventionnelService,
        FactureIndependantService $independantService
    ) {
        $this->conteneursService = $conteneursService;
        $this->conventionnelService = $conventionnelService;
        $this->independantService = $independantService;
    }

    /**
     * Obtenir le service approprié selon la catégorie
     */
    public function getService(string $categorie): FactureConteneursService|FactureConventionnelService|FactureIndependantService
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

        // Dates (DB: date_creation, date_echeance)
        $dateCreation = $data['date_creation']
            ?? $data['date_facture']
            ?? $data['date']
            ?? null;

        $data['date_creation'] = !empty($dateCreation) ? $dateCreation : now()->toDateString();

        // Nettoyer les alias API
        unset($data['date'], $data['date_facture']);

        if (!isset($data['date_echeance'])) {
            $echeanceJours = 30; // Par défaut 30 jours
            $data['date_echeance'] = \Carbon\Carbon::parse($data['date_creation'])->addDays($echeanceJours)->toDateString();
        }

        return $data;
    }

    /**
     * Créer une nouvelle facture avec le service approprié
     */
    public function creer(array $data): Facture
    {
        return DB::transaction(function () use ($data) {
            $data = $this->normaliserDonnees($data);
            $categorie = $data['categorie'] ?? 'conteneurs';

            // Générer le numéro
            $data['numero'] = $this->genererNumero();
            // Toute facture créée est directement "emise" (pas de brouillon)
            $data['statut'] = $data['statut'] ?? 'emise';
            $data['montant_paye'] = $data['montant_paye'] ?? 0;

            // Enregistrer l'utilisateur créateur
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

            // Créer la facture
            $facture = Facture::create($data);

            // Créer les éléments selon le type
            $service = $this->getService($categorie);

            if ($categorie === 'conteneurs' && !empty($conteneurs)) {
                $this->conteneursService->creerConteneurs($facture, $conteneurs);
            } elseif ($categorie === 'conventionnel' && !empty($lots)) {
                $this->conventionnelService->creerLots($facture, $lots);
            } elseif ($categorie === 'operations_independantes' && !empty($lignes)) {
                $this->independantService->creerLignes($facture, $lignes);
            }

            // Calculer les totaux avec le bon service
            $service->calculerTotaux($facture);

            // Créer les primes si présentes
            $this->creerPrimes($facture, $primeTransitaire, $primeRepresentant);

            // Mettre à jour le solde client
            $this->mettreAJourSoldeClient($facture->client_id);

            // Agréger les taxes pour les angles mensuels
            $this->agregerTaxesDocument($facture, 'facture');

            Log::info('Facture créée via Factory', [
                'facture_id' => $facture->id,
                'numero' => $facture->numero,
                'categorie' => $categorie,
            ]);

            return $facture->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur', 'primes']);
        });
    }

    /**
     * Créer les primes pour transitaire et représentant
     */
    protected function creerPrimes(Facture $facture, float $primeTransitaire, float $primeRepresentant): void
    {
        // Prime pour le transitaire
        if ($primeTransitaire > 0 && !empty($facture->transitaire_id)) {
            Prime::create([
                'ordre_id' => $facture->ordre_id ?? null,
                'facture_id' => $facture->id,
                'transitaire_id' => $facture->transitaire_id,
                'montant' => $primeTransitaire,
                'statut' => 'En attente',
                'description' => "Prime transitaire pour facture {$facture->numero}",
            ]);
            
            Log::info('Prime transitaire créée pour facture', [
                'facture_id' => $facture->id,
                'transitaire_id' => $facture->transitaire_id,
                'montant' => $primeTransitaire,
            ]);
        }

        // Prime pour le représentant
        if ($primeRepresentant > 0 && !empty($facture->representant_id)) {
            Prime::create([
                'ordre_id' => $facture->ordre_id ?? null,
                'facture_id' => $facture->id,
                'representant_id' => $facture->representant_id,
                'montant' => $primeRepresentant,
                'statut' => 'En attente',
                'description' => "Prime représentant pour facture {$facture->numero}",
            ]);
            
            Log::info('Prime représentant créée pour facture', [
                'facture_id' => $facture->id,
                'representant_id' => $facture->representant_id,
                'montant' => $primeRepresentant,
            ]);
        }
    }

    /**
     * Modifier une facture existante
     */
    public function modifier(Facture $facture, array $data): Facture
    {
        return DB::transaction(function () use ($facture, $data) {
            $ancienClientId = $facture->client_id;
            $categorie = $facture->categorie;
            $service = $this->getService($categorie);

            // Sauvegarder l'état avant modification pour recalcul des taxes
            $ancienEtat = clone $facture;

            // Extraire les primes avant update (elles ne sont pas des colonnes de la table factures)
            $primeTransitaire = $data['prime_transitaire'] ?? 0;
            $primeRepresentant = $data['prime_representant'] ?? 0;
            unset($data['prime_transitaire'], $data['prime_representant']);

            $facture->update($data);

            // Remplacer les conteneurs si fournis
            if (isset($data['conteneurs']) && $categorie === 'conteneurs') {
                foreach ($facture->conteneurs as $conteneur) {
                    $conteneur->operations()->delete();
                }
                $facture->conteneurs()->delete();
                $this->conteneursService->creerConteneurs($facture, $data['conteneurs']);
            }

            // Remplacer les lots si fournis
            if (isset($data['lots']) && $categorie === 'conventionnel') {
                $facture->lots()->delete();
                $this->conventionnelService->creerLots($facture, $data['lots']);
            }

            // Remplacer les lignes si fournies
            if (isset($data['lignes']) && $categorie === 'operations_independantes') {
                $facture->lignes()->delete();
                $this->independantService->creerLignes($facture, $data['lignes']);
            }

            // Recalculer les totaux
            $service->calculerTotaux($facture);

            // Gérer les primes (supprimer les anciennes et créer les nouvelles si montants > 0)
            if ($primeTransitaire > 0 || $primeRepresentant > 0) {
                // Supprimer les anciennes primes non payées de cette facture
                Prime::where('facture_id', $facture->id)
                    ->where('statut', 'En attente')
                    ->delete();
                
                // Créer les nouvelles primes
                $this->creerPrimes($facture, $primeTransitaire, $primeRepresentant);
            }

            // Mettre à jour les soldes clients si changement
            $this->mettreAJourSoldeClient($facture->client_id);
            if ($ancienClientId !== $facture->client_id) {
                $this->mettreAJourSoldeClient($ancienClientId);
            }

            // Recalculer les taxes (retirer ancien état, ajouter nouveau)
            $this->recalculerTaxesDocument($ancienEtat, $facture->fresh(), 'facture');

            Log::info('Facture modifiée via Factory', ['facture_id' => $facture->id]);

            return $facture->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Enregistrer un paiement sur une facture
     */
    public function enregistrerPaiement(Facture $facture, float $montant): void
    {
        $nouveauMontantPaye = $facture->montant_paye + $montant;
        
        $statut = $facture->statut;
        if ($nouveauMontantPaye >= $facture->montant_ttc) {
            $statut = 'payee';
        } elseif ($nouveauMontantPaye > 0) {
            $statut = 'partiellement_payee';
        }

        $facture->update([
            'montant_paye' => $nouveauMontantPaye,
            'statut' => $statut,
        ]);

        // Mettre à jour le solde client
        $this->mettreAJourSoldeClient($facture->client_id);

        Log::info('Paiement enregistré sur facture', [
            'facture_id' => $facture->id,
            'montant' => $montant,
            'nouveau_statut' => $statut,
        ]);
    }

    /**
     * Valider une facture (passage de brouillon à validée)
     */
    public function valider(Facture $facture): Facture
    {
        if ($facture->statut !== 'brouillon') {
            throw new \Exception('Seules les factures en brouillon peuvent être validées.');
        }

        $facture->update(['statut' => 'validee']);

        Log::info('Facture validée', ['facture_id' => $facture->id]);

        return $facture;
    }

    /**
     * Dupliquer une facture
     */
    public function dupliquer(Facture $facture): Facture
    {
        $data = $facture->toArray();
        unset($data['id'], $data['numero'], $data['ordre_id'], $data['created_at'], $data['updated_at']);
        
        $data['lignes'] = $facture->lignes->toArray();
        $data['conteneurs'] = $facture->conteneurs->map(function ($c) {
            $arr = $c->toArray();
            $arr['operations'] = $c->operations->toArray();
            return $arr;
        })->toArray();
        $data['lots'] = $facture->lots->toArray();
        $data['statut'] = 'brouillon';
        $data['montant_paye'] = 0;

        return $this->creer($data);
    }

    /**
     * Générer un numéro de facture unique
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
            
            $prefixe = $config->data['prefixe_facture'] ?? 'FAC';

            // Trouver le numéro maximum existant
            $maxNumero = Facture::withTrashed()
                ->where('numero', 'like', $prefixe . '-' . $annee . '-%')
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = ($maxNumero ?? 0) + 1;

            // S'assurer que le numéro est au moins égal au compteur stocké
            $compteurStocke = $config->data['prochain_numero_facture'] ?? 1;
            if ($prochainNumero < $compteurStocke) {
                $prochainNumero = $compteurStocke;
            }

            // Vérifier l'unicité
            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            while (Facture::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            // Mettre à jour le compteur
            $data = $config->data;
            $data['prochain_numero_facture'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return $numero;
        });
    }

    /**
     * Mettre à jour le solde d'un client
     */
    public function mettreAJourSoldeClient(int $clientId): void
    {
        $client = Client::find($clientId);
        if (!$client) return;

        $totalFactures = Facture::where('client_id', $clientId)
            ->whereNotIn('statut', ['annulee'])
            ->sum('montant_ttc');

        $totalPaye = Facture::where('client_id', $clientId)
            ->whereNotIn('statut', ['annulee'])
            ->sum('montant_paye');

        $client->update([
            'solde' => $totalFactures - $totalPaye,
        ]);
    }
}
