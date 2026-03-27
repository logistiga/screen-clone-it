<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDevisRequest;
use App\Http\Requests\UpdateDevisRequest;
use App\Http\Resources\DevisResource;
use App\Models\Devis;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * CRUD Devis - Conversion et duplication déléguées à DevisConversionController
 */
class DevisController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Devis::lite()
                ->search($request->get('search'))
                ->statut($request->get('statut'))
                ->client($request->get('client_id'))
                ->dateRange($request->get('date_debut'), $request->get('date_fin'));

            $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
            $devis = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json(DevisResource::collection($devis)->response()->getData(true));
        } catch (\Throwable $e) {
            Log::error('Erreur listing devis', ['exception' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors du chargement des devis', 'error' => config('app.debug') ? $e->getMessage() : null], 500);
        }
    }

    public function store(StoreDevisRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $devis = DB::transaction(function () use ($data) {
                $data = $this->normaliserDonnees($data);
                $lignes = $data['lignes'] ?? [];
                $conteneurs = $data['conteneurs'] ?? [];
                $lots = $data['lots'] ?? [];
                unset($data['lignes'], $data['conteneurs'], $data['lots']);

                $devis = new Devis();
                $devis->fill($data);
                $devis->forceFill([
                    'numero' => Devis::genererNumero(),
                    'date_creation' => now()->toDateString(),
                    'statut' => $data['statut'] ?? 'brouillon',
                ]);
                $devis->save();

                $this->creerElements($devis, $lignes, $conteneurs, $lots);
                $devis->calculerTotaux();

                return $devis->fresh(['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots']);
            });

            Audit::log('create', 'devis', "Devis créé: {$devis->numero}", $devis->id);
            return response()->json(new DevisResource($devis), 201);
        } catch (\Throwable $e) {
            Log::error('Erreur création devis', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Erreur lors de la création du devis', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Devis $devis): JsonResponse
    {
        try {
            $devis->loadMissing(['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots', 'ordre', 'annulation']);
            return response()->json(new DevisResource($devis));
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur lors du chargement du devis', 'error' => $e->getMessage()], 500);
        }
    }

    public function update(UpdateDevisRequest $request, Devis $devis): JsonResponse
    {
        if (in_array(strtolower($devis->statut), ['converti', 'accepte'])) {
            return response()->json(['message' => 'Impossible de modifier un devis converti ou accepté'], 422);
        }

        try {
            $data = $request->validated();
            $oldValues = $devis->only(['montant_ht', 'montant_ttc', 'montant_tva', 'montant_css', 'remise_type', 'remise_valeur', 'remise_montant', 'statut', 'date_validite', 'navire', 'voyage', 'port_origine', 'port_destination', 'notes', 'observations', 'type_operation', 'client_id', 'transitaire_id', 'armateur_id']);

            DB::transaction(function () use ($devis, $data) {
                $conteneurs = $data['conteneurs'] ?? null;
                $lots = $data['lots'] ?? null;
                $lignes = $data['lignes'] ?? null;
                unset($data['conteneurs'], $data['lots'], $data['lignes']);

                if (isset($data['bl_numero'])) { $data['numero_bl'] = $data['bl_numero']; unset($data['bl_numero']); }
                unset($data['numero'], $data['date_creation']);

                $devis->update($data);

                if ($conteneurs !== null && $devis->categorie === 'conteneurs') {
                    $devis->conteneurs()->each(fn($c) => $c->operations()->delete());
                    $devis->conteneurs()->delete();
                    $this->creerConteneurs($devis, $conteneurs);
                }
                if ($lots !== null && $devis->categorie === 'conventionnel') {
                    $devis->lots()->delete();
                    $this->creerLots($devis, $lots);
                }
                if ($lignes !== null && $devis->categorie === 'operations_independantes') {
                    $devis->lignes()->delete();
                    $this->creerLignes($devis, $lignes);
                }
                $devis->calculerTotaux();
            });

            $devis->refresh();
            $newValues = $devis->only(['montant_ht', 'montant_ttc', 'montant_tva', 'montant_css', 'remise_type', 'remise_valeur', 'remise_montant', 'statut', 'date_validite', 'navire', 'voyage', 'port_origine', 'port_destination', 'notes', 'observations', 'type_operation', 'client_id', 'transitaire_id', 'armateur_id']);
            Audit::log('update', 'devis', "Devis modifié: {$devis->numero}", $devis, $oldValues, $newValues);

            return response()->json(new DevisResource($devis->fresh(['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots'])));
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $e->getMessage()], 500);
        }
    }

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
            try { Audit::log('delete', 'devis', "Devis supprimé: {$numero}", $devis); } catch (\Throwable $e) {}
            return response()->json(['message' => 'Devis supprimé avec succès']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur lors de la suppression', 'error' => $e->getMessage()], 500);
        }
    }

    // === Délégation conversion ===
    public function convertToOrdre(Devis $devis): JsonResponse { return app(DevisConversionController::class)->convertToOrdre($devis); }
    public function convertToFacture(Devis $devis): JsonResponse { return app(DevisConversionController::class)->convertToFacture($devis); }
    public function duplicate(Devis $devis): JsonResponse { return app(DevisConversionController::class)->duplicate($devis); }

    // === Méthodes privées ===
    private function normaliserDonnees(array $data): array
    {
        if (isset($data['type_document']) && !isset($data['categorie'])) {
            $data['categorie'] = match ($data['type_document']) { 'Conteneur' => 'conteneurs', 'Lot' => 'conventionnel', 'Independant' => 'operations_independantes', default => 'conteneurs' };
        }
        unset($data['type_document']);
        if (isset($data['bl_numero']) && !isset($data['numero_bl'])) { $data['numero_bl'] = $data['bl_numero']; }
        unset($data['bl_numero']);
        $data['date_creation'] = $data['date_creation'] ?? now()->toDateString();
        if (!isset($data['date_validite'])) {
            $validite = max(1, min(365, (int) ($data['validite_jours'] ?? 30)));
            $data['date_validite'] = now()->addDays($validite)->toDateString();
        }
        unset($data['validite_jours'], $data['date_arrivee']);
        return $data;
    }

    private function creerElements(Devis $devis, array $lignes, array $conteneurs, array $lots): void
    {
        switch ($devis->categorie) {
            case 'conteneurs': $this->creerConteneurs($devis, $conteneurs); break;
            case 'conventionnel': $this->creerLots($devis, $lots); break;
            case 'operations_independantes': $this->creerLignes($devis, $lignes); break;
        }
    }

    private function creerConteneurs(Devis $devis, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneurData) {
            $operations = $conteneurData['operations'] ?? [];
            unset($conteneurData['operations'], $conteneurData['type'], $conteneurData['armateur_id']);
            $conteneurData['taille'] = str_replace("'", "", $conteneurData['taille'] ?? '20');
            $conteneur = $devis->conteneurs()->create(['numero' => $conteneurData['numero'] ?? '', 'taille' => $conteneurData['taille'], 'description' => $conteneurData['description'] ?? '', 'prix_unitaire' => $conteneurData['prix_unitaire'] ?? 0]);
            foreach ($operations as $opData) {
                if (isset($opData['type_operation']) && !isset($opData['type'])) { $opData['type'] = $opData['type_operation']; unset($opData['type_operation']); }
                $opData['prix_total'] = ($opData['quantite'] ?? 1) * ($opData['prix_unitaire'] ?? 0);
                $conteneur->operations()->create($opData);
            }
        }
    }

    private function creerLots(Devis $devis, array $lots): void
    {
        foreach (array_values($lots) as $i => $lotData) {
            if (isset($lotData['designation']) && !isset($lotData['description'])) { $lotData['description'] = $lotData['designation']; }
            unset($lotData['designation']);
            $lotData['numero_lot'] = $lotData['numero_lot'] ?? 'LOT-' . ($i + 1);
            $lotData['quantite'] = $lotData['quantite'] ?? 1;
            $lotData['prix_unitaire'] = $lotData['prix_unitaire'] ?? 0;
            $lotData['prix_total'] = $lotData['quantite'] * $lotData['prix_unitaire'];
            $devis->lots()->create($lotData);
        }
    }

    private function creerLignes(Devis $devis, array $lignes): void
    {
        foreach ($lignes as $ligneData) {
            if (isset($ligneData['type_operation']) && empty($ligneData['description'])) { $ligneData['description'] = $ligneData['type_operation']; }
            $ligneData['quantite'] = $ligneData['quantite'] ?? 1;
            $ligneData['prix_unitaire'] = $ligneData['prix_unitaire'] ?? 0;
            $ligneData['montant_ht'] = $ligneData['quantite'] * $ligneData['prix_unitaire'];
            $devis->lignes()->create($ligneData);
        }
    }
}
