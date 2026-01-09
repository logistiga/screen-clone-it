<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDevisRequest;
use App\Http\Requests\UpdateDevisRequest;
use App\Http\Resources\DevisResource;
use App\Http\Resources\OrdreTravailResource;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DevisController extends Controller
{
    /**
     * Liste des devis avec filtres et pagination
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Devis::with(['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots']);

            // Recherche
            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('numero', 'like', "%{$search}%")
                      ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
                });
            }

            // Filtres
            if ($request->filled('statut')) {
                $query->where('statut', $request->get('statut'));
            }

            if ($request->filled('client_id')) {
                $query->where('client_id', $request->get('client_id'));
            }

            if ($request->filled('date_debut') && $request->filled('date_fin')) {
                $query->whereBetween('date_creation', [
                    $request->get('date_debut'),
                    $request->get('date_fin')
                ]);
            }

            $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
            $devis = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json(DevisResource::collection($devis)->response()->getData(true));

        } catch (\Throwable $e) {
            Log::error('Erreur listing devis', ['exception' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du chargement des devis',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Créer un nouveau devis
     */
    public function store(StoreDevisRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $devis = DB::transaction(function () use ($data) {
                // Normaliser les données
                $data = $this->normaliserDonnees($data);

                // Générer le numéro
                $data['numero'] = Devis::genererNumero();
                $data['statut'] = $data['statut'] ?? 'brouillon';

                // Extraire les relations
                $lignes = $data['lignes'] ?? [];
                $conteneurs = $data['conteneurs'] ?? [];
                $lots = $data['lots'] ?? [];
                unset($data['lignes'], $data['conteneurs'], $data['lots']);

                // Créer le devis
                $devis = Devis::create($data);

                // Créer les éléments selon la catégorie
                $this->creerElements($devis, $lignes, $conteneurs, $lots);

                // Calculer les totaux
                $devis->calculerTotaux();

                return $devis->fresh(['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots']);
            });

            Audit::log('create', 'devis', "Devis créé: {$devis->numero}", $devis->id);

            Log::info('Devis créé', ['id' => $devis->id, 'numero' => $devis->numero]);

            return response()->json(new DevisResource($devis), 201);

        } catch (\Throwable $e) {
            Log::error('Erreur création devis', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création du devis',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Afficher un devis
     */
    public function show(Devis $devis): JsonResponse
    {
        try {
            $devis->load(['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots']);
            return response()->json(new DevisResource($devis));

        } catch (\Throwable $e) {
            Log::error('Erreur affichage devis', ['devis_id' => $devis->id, 'message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du chargement du devis',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mettre à jour un devis
     */
    public function update(UpdateDevisRequest $request, Devis $devis): JsonResponse
    {
        if (in_array(strtolower($devis->statut), ['converti', 'accepte'])) {
            return response()->json(['message' => 'Impossible de modifier un devis converti ou accepté'], 422);
        }

        try {
            $data = $request->validated();

            DB::transaction(function () use ($devis, $data) {
                // Normaliser
                if (isset($data['bl_numero'])) {
                    $data['numero_bl'] = $data['bl_numero'];
                    unset($data['bl_numero']);
                }
                unset($data['numero'], $data['date_creation']);

                // Mettre à jour les champs principaux
                $devis->update($data);

                // Mettre à jour les éléments si fournis
                if (isset($data['conteneurs']) && $devis->categorie === 'conteneurs') {
                    $devis->conteneurs()->each(fn($c) => $c->operations()->delete());
                    $devis->conteneurs()->delete();
                    $this->creerConteneurs($devis, $data['conteneurs']);
                }

                if (isset($data['lots']) && $devis->categorie === 'conventionnel') {
                    $devis->lots()->delete();
                    $this->creerLots($devis, $data['lots']);
                }

                if (isset($data['lignes']) && $devis->categorie === 'operations_independantes') {
                    $devis->lignes()->delete();
                    $this->creerLignes($devis, $data['lignes']);
                }

                $devis->calculerTotaux();
            });

            Audit::log('update', 'devis', "Devis modifié: {$devis->numero}", $devis->id);

            return response()->json(new DevisResource($devis->fresh(['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots'])));

        } catch (\Throwable $e) {
            Log::error('Erreur modification devis', ['devis_id' => $devis->id, 'message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un devis
     */
    public function destroy(Devis $devis): JsonResponse
    {
        if (strtolower($devis->statut) === 'converti') {
            return response()->json(['message' => 'Impossible de supprimer un devis converti'], 422);
        }

        $numero = $devis->numero;

        try {
            DB::transaction(function () use ($devis) {
                $devis->conteneurs()->each(fn($c) => $c->operations()->delete());
                $devis->conteneurs()->delete();
                $devis->lignes()->delete();
                $devis->lots()->delete();
                $devis->delete();
            });

            try {
                Audit::log('delete', 'devis', "Devis supprimé: {$numero}", $devis);
            } catch (\Throwable $e) {
                Log::warning('Audit delete devis échoué', ['message' => $e->getMessage()]);
            }

            return response()->json(['message' => 'Devis supprimé avec succès']);

        } catch (\Throwable $e) {
            Log::error('Erreur suppression devis', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convertir un devis en ordre de travail
     */
    public function convertToOrdre(Devis $devis): JsonResponse
    {
        if (strtolower($devis->statut) === 'converti') {
            return response()->json(['message' => 'Ce devis a déjà été converti'], 422);
        }

        try {
            $ordre = DB::transaction(function () use ($devis) {
                $devis->load(['lignes', 'conteneurs.operations', 'lots']);

                // Créer l'ordre de travail
                $ordre = OrdreTravail::create([
                    'numero' => OrdreTravail::genererNumero(),
                    'devis_id' => $devis->id,
                    'client_id' => $devis->client_id,
                    'date_creation' => now(),
                    'categorie' => $devis->categorie,
                    'type_operation' => $devis->type_operation,
                    'type_operation_indep' => $devis->type_operation_indep,
                    'armateur_id' => $devis->armateur_id,
                    'transitaire_id' => $devis->transitaire_id,
                    'representant_id' => $devis->representant_id,
                    'navire' => $devis->navire,
                    'numero_bl' => $devis->numero_bl,
                    'montant_ht' => $devis->montant_ht,
                    'tva' => $devis->tva,
                    'css' => $devis->css,
                    'montant_ttc' => $devis->montant_ttc,
                    'montant_paye' => 0,
                    'statut' => 'en_cours',
                    'notes' => $devis->notes,
                ]);

                // Copier les lignes
                foreach ($devis->lignes as $ligne) {
                    $ordre->lignes()->create([
                        'description' => $ligne->description,
                        'quantite' => $ligne->quantite,
                        'prix_unitaire' => $ligne->prix_unitaire,
                        'montant_ht' => $ligne->montant_ht,
                        'lieu_depart' => $ligne->lieu_depart,
                        'lieu_arrivee' => $ligne->lieu_arrivee,
                        'date_debut' => $ligne->date_debut,
                        'date_fin' => $ligne->date_fin,
                    ]);
                }

                // Copier les conteneurs et leurs opérations
                foreach ($devis->conteneurs as $conteneur) {
                    $newConteneur = $ordre->conteneurs()->create([
                        'numero' => $conteneur->numero,
                        'taille' => $conteneur->taille,
                        'type' => $conteneur->type,
                        'description' => $conteneur->description,
                        'prix_unitaire' => $conteneur->prix_unitaire,
                        'armateur_id' => $conteneur->armateur_id,
                    ]);

                    foreach ($conteneur->operations as $op) {
                        $newConteneur->operations()->create([
                            'type' => $op->type,
                            'description' => $op->description,
                            'quantite' => $op->quantite,
                            'prix_unitaire' => $op->prix_unitaire,
                            'prix_total' => $op->prix_total,
                        ]);
                    }
                }

                // Copier les lots
                foreach ($devis->lots as $lot) {
                    $ordre->lots()->create([
                        'numero_lot' => $lot->numero_lot,
                        'description' => $lot->description,
                        'quantite' => $lot->quantite,
                        'poids' => $lot->poids,
                        'volume' => $lot->volume,
                        'prix_unitaire' => $lot->prix_unitaire,
                        'prix_total' => $lot->prix_total,
                    ]);
                }

                // Marquer le devis comme converti
                $devis->update(['statut' => 'converti']);

                return $ordre;
            });

            Audit::log('convert', 'devis', "Devis converti en ordre: {$devis->numero} -> {$ordre->numero}", $devis->id);

            return response()->json([
                'message' => 'Devis converti en ordre de travail',
                'ordre' => new OrdreTravailResource($ordre->fresh(['client', 'lignes', 'conteneurs.operations', 'lots']))
            ]);

        } catch (\Throwable $e) {
            Log::error('Erreur conversion devis->ordre', ['devis_id' => $devis->id, 'message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la conversion',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Dupliquer un devis
     */
    public function duplicate(Devis $devis): JsonResponse
    {
        try {
            $newDevis = DB::transaction(function () use ($devis) {
                $devis->load(['lignes', 'conteneurs.operations', 'lots']);

                $newDevis = Devis::create([
                    'numero' => Devis::genererNumero(),
                    'client_id' => $devis->client_id,
                    'date_creation' => now(),
                    'date_validite' => now()->addDays(30),
                    'categorie' => $devis->categorie,
                    'type_operation' => $devis->type_operation,
                    'type_operation_indep' => $devis->type_operation_indep,
                    'armateur_id' => $devis->armateur_id,
                    'transitaire_id' => $devis->transitaire_id,
                    'representant_id' => $devis->representant_id,
                    'navire' => $devis->navire,
                    'numero_bl' => $devis->numero_bl,
                    'notes' => $devis->notes,
                    'statut' => 'brouillon',
                ]);

                // Copier les éléments
                foreach ($devis->lignes as $ligne) {
                    $newDevis->lignes()->create($ligne->only(['description', 'quantite', 'prix_unitaire', 'lieu_depart', 'lieu_arrivee', 'date_debut', 'date_fin']));
                }

                foreach ($devis->conteneurs as $conteneur) {
                    $newConteneur = $newDevis->conteneurs()->create($conteneur->only(['numero', 'taille', 'type', 'description', 'prix_unitaire', 'armateur_id']));
                    foreach ($conteneur->operations as $op) {
                        $newConteneur->operations()->create($op->only(['type', 'description', 'quantite', 'prix_unitaire']));
                    }
                }

                foreach ($devis->lots as $lot) {
                    $newDevis->lots()->create($lot->only(['numero_lot', 'description', 'quantite', 'poids', 'volume', 'prix_unitaire']));
                }

                $newDevis->calculerTotaux();

                return $newDevis;
            });

            Audit::log('duplicate', 'devis', "Devis dupliqué: {$devis->numero} -> {$newDevis->numero}", $newDevis->id);

            return response()->json(new DevisResource($newDevis->fresh(['client', 'lignes', 'conteneurs.operations', 'lots'])), 201);

        } catch (\Throwable $e) {
            Log::error('Erreur duplication devis', ['devis_id' => $devis->id, 'message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la duplication',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================
    // MÉTHODES PRIVÉES
    // =========================================

    /**
     * Normaliser les données de l'API vers le format DB
     */
    private function normaliserDonnees(array $data): array
    {
        // type_document -> categorie
        if (isset($data['type_document']) && !isset($data['categorie'])) {
            $data['categorie'] = match ($data['type_document']) {
                'Conteneur' => 'conteneurs',
                'Lot' => 'conventionnel',
                'Independant' => 'operations_independantes',
                default => 'conteneurs',
            };
        }
        unset($data['type_document']);

        // bl_numero -> numero_bl
        if (isset($data['bl_numero']) && !isset($data['numero_bl'])) {
            $data['numero_bl'] = $data['bl_numero'];
        }
        unset($data['bl_numero']);

        // Dates
        $data['date_creation'] = $data['date_creation'] ?? now()->toDateString();

        if (!isset($data['date_validite'])) {
            $validite = max(1, min(365, (int) ($data['validite_jours'] ?? 30)));
            $data['date_validite'] = now()->addDays($validite)->toDateString();
        }
        unset($data['validite_jours'], $data['date_arrivee']);

        return $data;
    }

    /**
     * Créer les éléments selon la catégorie
     */
    private function creerElements(Devis $devis, array $lignes, array $conteneurs, array $lots): void
    {
        switch ($devis->categorie) {
            case 'conteneurs':
                $this->creerConteneurs($devis, $conteneurs);
                break;
            case 'conventionnel':
                $this->creerLots($devis, $lots);
                break;
            case 'operations_independantes':
                $this->creerLignes($devis, $lignes);
                break;
        }
    }

    /**
     * Créer les conteneurs et leurs opérations
     */
    private function creerConteneurs(Devis $devis, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneurData) {
            $operations = $conteneurData['operations'] ?? [];
            unset($conteneurData['operations']);

            // Normaliser
            $conteneurData['taille'] = str_replace("'", "", $conteneurData['taille'] ?? '20');
            $conteneurData['type'] = $conteneurData['type'] ?? 'DRY';

            $conteneur = $devis->conteneurs()->create($conteneurData);

            foreach ($operations as $opData) {
                // API: type_operation -> DB: type
                if (isset($opData['type_operation']) && !isset($opData['type'])) {
                    $opData['type'] = $opData['type_operation'];
                    unset($opData['type_operation']);
                }
                $opData['prix_total'] = ($opData['quantite'] ?? 1) * ($opData['prix_unitaire'] ?? 0);
                $conteneur->operations()->create($opData);
            }
        }
    }

    /**
     * Créer les lots
     */
    private function creerLots(Devis $devis, array $lots): void
    {
        foreach (array_values($lots) as $i => $lotData) {
            // designation -> description
            if (isset($lotData['designation']) && !isset($lotData['description'])) {
                $lotData['description'] = $lotData['designation'];
            }
            unset($lotData['designation']);

            $lotData['numero_lot'] = $lotData['numero_lot'] ?? 'LOT-' . ($i + 1);
            $lotData['quantite'] = $lotData['quantite'] ?? 1;
            $lotData['prix_unitaire'] = $lotData['prix_unitaire'] ?? 0;
            $lotData['prix_total'] = $lotData['quantite'] * $lotData['prix_unitaire'];

            $devis->lots()->create($lotData);
        }
    }

    /**
     * Créer les lignes de prestations
     */
    private function creerLignes(Devis $devis, array $lignes): void
    {
        foreach ($lignes as $ligneData) {
            // type_operation -> description si pas de description
            if (isset($ligneData['type_operation']) && empty($ligneData['description'])) {
                $ligneData['description'] = $ligneData['type_operation'];
            }

            $ligneData['quantite'] = $ligneData['quantite'] ?? 1;
            $ligneData['prix_unitaire'] = $ligneData['prix_unitaire'] ?? 0;
            $ligneData['montant_ht'] = $ligneData['quantite'] * $ligneData['prix_unitaire'];

            $devis->lignes()->create($ligneData);
        }
    }
}
