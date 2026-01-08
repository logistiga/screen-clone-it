<?php

namespace App\Services\Devis;

use App\Models\Devis;
use App\Models\Configuration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Factory/Router principal pour les services Devis.
 * Route vers le service spécialisé selon le type de document.
 */
class DevisServiceFactory
{
    protected DevisConteneursService $conteneursService;
    protected DevisConventionnelService $conventionnelService;
    protected DevisIndependantService $independantService;

    public function __construct(
        DevisConteneursService $conteneursService,
        DevisConventionnelService $conventionnelService,
        DevisIndependantService $independantService
    ) {
        $this->conteneursService = $conteneursService;
        $this->conventionnelService = $conventionnelService;
        $this->independantService = $independantService;
    }

    /**
     * Obtenir le service approprié selon la catégorie
     */
    public function getService(string $categorie): DevisConteneursService|DevisConventionnelService|DevisIndependantService
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

        // type_operation pour conteneurs (import/export)
        if (isset($data['type_operation'])) {
            // Garder tel quel, le modèle l'attend
        }

        // type_operation_indep pour opérations indépendantes
        if (isset($data['type_operation_indep'])) {
            // Garder tel quel, le modèle l'attend
        }

        // Dates
        $data['date_creation'] = $data['date_creation'] ?? now()->toDateString();
        $data['date'] = $data['date'] ?? now()->toDateString();

        if (!isset($data['date_validite'])) {
            $validite = isset($data['validite_jours']) ? (int) $data['validite_jours'] : 30;
            $validite = max(1, min(365, $validite));
            $data['date_validite'] = now()->addDays($validite)->toDateString();
        }
        unset($data['validite_jours'], $data['date_arrivee']);

        return $data;
    }

    /**
     * Créer un nouveau devis avec le service approprié
     */
    public function creer(array $data): Devis
    {
        return DB::transaction(function () use ($data) {
            $data = $this->normaliserDonnees($data);
            $categorie = $data['categorie'] ?? 'conteneurs';

            // Générer le numéro
            $data['numero'] = $this->genererNumero();
            $data['statut'] = $data['statut'] ?? 'brouillon';

            // Extraire les relations avant l'insert
            $lignes = $data['lignes'] ?? [];
            $conteneurs = $data['conteneurs'] ?? [];
            $lots = $data['lots'] ?? [];
            unset($data['lignes'], $data['conteneurs'], $data['lots']);

            // Créer le devis
            $devis = Devis::create($data);

            // Créer les éléments selon le type
            $service = $this->getService($categorie);

            if ($categorie === 'conteneurs' && !empty($conteneurs)) {
                $this->conteneursService->creerConteneurs($devis, $conteneurs);
            } elseif ($categorie === 'conventionnel' && !empty($lots)) {
                $this->conventionnelService->creerLots($devis, $lots);
            } elseif ($categorie === 'operations_independantes' && !empty($lignes)) {
                $this->independantService->creerLignes($devis, $lignes);
            }

            // Calculer les totaux avec le bon service
            $service->calculerTotaux($devis);

            Log::info('Devis créé via Factory', [
                'devis_id' => $devis->id,
                'numero' => $devis->numero,
                'categorie' => $categorie,
            ]);

            return $devis->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Modifier un devis existant
     */
    public function modifier(Devis $devis, array $data): Devis
    {
        return DB::transaction(function () use ($devis, $data) {
            $categorie = $devis->categorie;
            $service = $this->getService($categorie);

            $devis->update($data);

            // Remplacer les conteneurs si fournis
            if (isset($data['conteneurs']) && $categorie === 'conteneurs') {
                foreach ($devis->conteneurs as $conteneur) {
                    $conteneur->operations()->delete();
                }
                $devis->conteneurs()->delete();
                $this->conteneursService->creerConteneurs($devis, $data['conteneurs']);
            }

            // Remplacer les lots si fournis
            if (isset($data['lots']) && $categorie === 'conventionnel') {
                $devis->lots()->delete();
                $this->conventionnelService->creerLots($devis, $data['lots']);
            }

            // Remplacer les lignes si fournies
            if (isset($data['lignes']) && $categorie === 'operations_independantes') {
                $devis->lignes()->delete();
                $this->independantService->creerLignes($devis, $data['lignes']);
            }

            // Recalculer les totaux
            $service->calculerTotaux($devis);

            Log::info('Devis modifié via Factory', ['devis_id' => $devis->id]);

            return $devis->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Convertir un devis en ordre de travail
     */
    public function convertirEnOrdre(Devis $devis): \App\Models\OrdreTravail
    {
        return DB::transaction(function () use ($devis) {
            $categorie = $devis->categorie;
            $service = $this->getService($categorie);

            $ordreFactory = app(\App\Services\OrdreTravail\OrdreServiceFactory::class);

            $ordreData = [
                'client_id' => $devis->client_id,
                'devis_id' => $devis->id,
                'armateur_id' => $devis->armateur_id,
                'transitaire_id' => $devis->transitaire_id,
                'representant_id' => $devis->representant_id,
                'type_document' => $devis->type_document,
                'categorie' => $categorie,
                'bl_numero' => $devis->bl_numero,
                'navire' => $devis->navire,
                'date_arrivee' => $devis->date_arrivee,
                'notes' => $devis->notes,
                'statut' => 'en_cours',
            ];

            // Ajouter les éléments spécifiques au type
            $ordreData = array_merge($ordreData, $service->preparerPourConversion($devis));

            $ordre = $ordreFactory->creer($ordreData);

            $devis->update(['statut' => 'converti']);

            Log::info('Devis converti via Factory', [
                'devis_id' => $devis->id,
                'ordre_id' => $ordre->id,
                'categorie' => $categorie,
            ]);

            return $ordre;
        });
    }

    /**
     * Dupliquer un devis
     */
    public function dupliquer(Devis $devis): Devis
    {
        $data = $devis->toArray();
        unset($data['id'], $data['numero'], $data['created_at'], $data['updated_at']);

        $data['lignes'] = $devis->lignes->toArray();
        $data['conteneurs'] = $devis->conteneurs->map(function ($c) {
            $arr = $c->toArray();
            $arr['operations'] = $c->operations->toArray();
            return $arr;
        })->toArray();
        $data['lots'] = $devis->lots->toArray();
        $data['statut'] = 'brouillon';

        return $this->creer($data);
    }

    /**
     * Générer un numéro de devis unique
     */
    protected function genererNumero(): string
    {
        $annee = date('Y');

        return DB::transaction(function () use ($annee) {
            // Verrouiller la ligne de configuration pour empêcher les lectures concurrentes
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();
            
            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'],
                ]);
            }

            $prefixe = $config->data['prefixe_devis'] ?? 'DEV';

            // Trouver le numéro maximum existant dans la base (incluant soft-deleted)
            $maxNumero = Devis::withTrashed()
                ->where('numero', 'like', $prefixe . '-' . $annee . '-%')
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = ($maxNumero ?? 0) + 1;

            // S'assurer que le numéro est au moins égal au compteur stocké
            $compteurStocke = $config->data['prochain_numero_devis'] ?? 1;
            if ($prochainNumero < $compteurStocke) {
                $prochainNumero = $compteurStocke;
            }

            // Générer le numéro candidat
            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);

            // Vérifier que ce numéro n'existe vraiment pas (double sécurité)
            while (Devis::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            // Mettre à jour le compteur
            $data = $config->data;
            $data['prochain_numero_devis'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            Log::info('Numéro devis généré', ['numero' => $numero, 'prochain' => $prochainNumero + 1]);

            return $numero;
        });
    }
}
