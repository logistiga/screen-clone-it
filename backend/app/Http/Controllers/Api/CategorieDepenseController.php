<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategorieDepenseResource;
use App\Http\Resources\MouvementCaisseResource;
use App\Models\CategorieDepense;
use App\Models\MouvementCaisse;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategorieDepenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CategorieDepense::query();

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        $categories = $query->orderBy('nom')->get();

        // Ajouter les stats si demandé
        if ($request->has('with_stats')) {
            $categories->each(function ($cat) {
                $cat->total_depenses = $cat->mouvements()->where('type', 'Sortie')->sum('montant');
                $cat->nombre_mouvements = $cat->mouvements()->count();
            });
        }

        return response()->json(['data' => CategorieDepenseResource::collection($categories)]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100|unique:categories_depenses,nom',
            'description' => 'nullable|string|max:255',
            'type' => 'required|in:Entrée,Sortie',
            'couleur' => 'nullable|string|max:20',
            'actif' => 'boolean',
        ]);

        $categorie = CategorieDepense::create($validated);

        Audit::log('create', 'categorie_depense', "Catégorie créée: {$categorie->nom}", $categorie->id);

        return response()->json(new CategorieDepenseResource($categorie), 201);
    }

    public function show(CategorieDepense $categoriesDepense): JsonResponse
    {
        return response()->json(new CategorieDepenseResource($categoriesDepense));
    }

    public function update(Request $request, CategorieDepense $categoriesDepense): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100|unique:categories_depenses,nom,' . $categoriesDepense->id,
            'description' => 'nullable|string|max:255',
            'type' => 'sometimes|required|in:Entrée,Sortie',
            'couleur' => 'nullable|string|max:20',
            'actif' => 'boolean',
        ]);

        $categoriesDepense->update($validated);

        Audit::log('update', 'categorie_depense', "Catégorie modifiée: {$categoriesDepense->nom}", $categoriesDepense->id);

        return response()->json(new CategorieDepenseResource($categoriesDepense));
    }

    public function destroy(CategorieDepense $categoriesDepense): JsonResponse
    {
        // Vérifier s'il y a des mouvements liés
        $count = $categoriesDepense->mouvements()->count();
        if ($count > 0) {
            return response()->json([
                'message' => "Impossible de supprimer cette catégorie car elle est utilisée par {$count} mouvement(s)."
            ], 422);
        }

        Audit::log('delete', 'categorie_depense', "Catégorie supprimée: {$categoriesDepense->nom}", $categoriesDepense->id);

        $categoriesDepense->delete();

        return response()->json(['message' => 'Catégorie supprimée avec succès']);
    }

    public function mouvements(CategorieDepense $categoriesDepense, Request $request): JsonResponse
    {
        $query = $categoriesDepense->mouvements()->with(['banque', 'user']);

        if ($request->filled('date_debut')) {
            $query->where('date', '>=', $request->get('date_debut'));
        }

        if ($request->filled('date_fin')) {
            $query->where('date', '<=', $request->get('date_fin'));
        }

        if ($request->filled('source')) {
            $query->where('source', $request->get('source'));
        }

        $mouvements = $query->orderBy('date', 'desc')->paginate($request->get('per_page', 20));

        return response()->json(MouvementCaisseResource::collection($mouvements)->response()->getData(true));
    }

    public function stats(): JsonResponse
    {
        $categories = CategorieDepense::where('type', 'Sortie')
            ->where('actif', true)
            ->get()
            ->map(function ($cat) {
                return [
                    'id' => $cat->id,
                    'nom' => $cat->nom,
                    'couleur' => $cat->couleur,
                    'total' => (float) $cat->mouvements()->where('type', 'Sortie')->sum('montant'),
                    'count' => $cat->mouvements()->count(),
                ];
            })
            ->sortByDesc('total')
            ->values();

        return response()->json(['data' => $categories]);
    }
}
