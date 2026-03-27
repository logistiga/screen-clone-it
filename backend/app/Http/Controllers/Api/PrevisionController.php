<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrevisionRequest;
use App\Http\Requests\UpdatePrevisionRequest;
use App\Http\Resources\PrevisionResource;
use App\Models\Prevision;
use App\Models\Audit;
use App\Services\PrevisionSyncService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * CRUD Prévisions - Stats/historique déléguées à PrevisionStatsController
 */
class PrevisionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $annee = $request->get('annee');
        $mois = $request->get('mois');
        if ($annee && $mois) { app(PrevisionSyncService::class)->syncMois((int) $annee, (int) $mois); }

        $query = Prevision::with(['user']);
        if ($request->has('type')) $query->where('type', $request->get('type'));
        if ($request->has('statut')) $query->where('statut', $request->get('statut'));
        if ($request->has('mois')) $query->where('mois', $request->get('mois'));
        if ($request->has('annee')) $query->where('annee', $request->get('annee'));

        $previsions = $query->orderBy('annee', 'desc')->orderBy('mois', 'desc')->orderBy('type')->orderBy('categorie')->paginate($request->get('per_page', 50));
        return response()->json(PrevisionResource::collection($previsions)->response()->getData(true));
    }

    public function store(StorePrevisionRequest $request): JsonResponse
    {
        if (Prevision::where('type', $request->type)->where('categorie', $request->categorie)->where('mois', $request->mois)->where('annee', $request->annee)->exists()) {
            return response()->json(['message' => 'Une prévision existe déjà pour cette catégorie et cette période'], 422);
        }

        $prevision = Prevision::create(['type' => $request->type, 'categorie' => $request->categorie, 'description' => $request->description, 'montant_prevu' => $request->montant_prevu, 'realise_caisse' => 0, 'realise_banque' => 0, 'mois' => $request->mois, 'annee' => $request->annee, 'statut' => 'en_cours', 'notes' => $request->notes, 'user_id' => auth()->id()]);
        Audit::log('create', 'prevision', "Prévision créée: {$request->type} - {$request->categorie}", $prevision->id);
        return response()->json(new PrevisionResource($prevision->load(['user'])), 201);
    }

    public function show(Prevision $prevision): JsonResponse
    {
        return response()->json(new PrevisionResource($prevision->load(['user'])));
    }

    public function update(UpdatePrevisionRequest $request, Prevision $prevision): JsonResponse
    {
        $prevision->update($request->validated());
        $prevision->updateStatut();
        Audit::log('update', 'prevision', "Prévision modifiée", $prevision->id);
        return response()->json(new PrevisionResource($prevision->load(['user'])));
    }

    public function destroy(Prevision $prevision): JsonResponse
    {
        Audit::log('delete', 'prevision', "Prévision supprimée: {$prevision->categorie}", $prevision->id);
        $prevision->delete();
        return response()->json(['message' => 'Prévision supprimée avec succès']);
    }

    public function categories(): JsonResponse
    {
        $categoriesEntree = \App\Models\CategorieDepense::where('type', 'Entrée')->where('actif', true)->orderBy('nom')->pluck('nom')->toArray();
        $categoriesSortie = \App\Models\CategorieDepense::where('type', 'Sortie')->where('actif', true)->orderBy('nom')->pluck('nom')->toArray();
        if (empty($categoriesEntree)) $categoriesEntree = Prevision::getCategoriesRecettes();
        if (empty($categoriesSortie)) $categoriesSortie = Prevision::getCategoriesDepenses();
        return response()->json(['recette' => $categoriesEntree, 'depense' => $categoriesSortie]);
    }

    // === Délégation stats ===
    public function statsMensuelles(Request $r): JsonResponse { return app(PrevisionStatsController::class)->statsMensuelles($r); }
    public function historique(Request $r): JsonResponse { return app(PrevisionStatsController::class)->historique($r); }
    public function syncRealise(Request $r): JsonResponse { return app(PrevisionStatsController::class)->syncRealise($r); }
    public function exportMois(Request $r): JsonResponse { return app(PrevisionStatsController::class)->exportMois($r); }
    public function stats(Request $r): JsonResponse { return app(PrevisionStatsController::class)->stats($r); }
}
