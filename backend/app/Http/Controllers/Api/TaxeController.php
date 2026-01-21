<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use App\Models\Taxe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaxeController extends Controller
{
    /**
     * Lister toutes les taxes
     */
    public function index(Request $request): JsonResponse
    {
        $query = Taxe::query()->ordonne();

        // Filtrer par statut actif
        if ($request->has('active')) {
            $query->where('active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        $taxes = $query->get();

        return response()->json([
            'data' => $taxes,
            'total' => $taxes->count(),
        ]);
    }

    /**
     * Récupérer une taxe
     */
    public function show(Taxe $taxe): JsonResponse
    {
        return response()->json([
            'data' => $taxe,
        ]);
    }

    /**
     * Créer une nouvelle taxe
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:taxes,code',
            'nom' => 'required|string|max:100',
            'taux' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string|max:500',
            'obligatoire' => 'boolean',
            'active' => 'boolean',
        ]);

        // Normaliser le code en majuscules
        $validated['code'] = strtoupper($validated['code']);

        // Calculer l'ordre (dernier + 1)
        $maxOrdre = Taxe::max('ordre') ?? 0;
        $validated['ordre'] = $maxOrdre + 1;

        $taxe = Taxe::create($validated);

        Audit::log('create', 'taxe', "Taxe {$taxe->code} créée", [
            'id' => $taxe->id,
            'code' => $taxe->code,
            'taux' => $taxe->taux,
        ]);

        return response()->json([
            'message' => 'Taxe créée avec succès',
            'data' => $taxe,
        ], 201);
    }

    /**
     * Mettre à jour une taxe
     */
    public function update(Request $request, Taxe $taxe): JsonResponse
    {
        $validated = $request->validate([
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('taxes', 'code')->ignore($taxe->id),
            ],
            'nom' => 'sometimes|required|string|max:100',
            'taux' => 'sometimes|required|numeric|min:0|max:100',
            'description' => 'nullable|string|max:500',
            'obligatoire' => 'boolean',
            'active' => 'boolean',
            'ordre' => 'integer|min:0',
        ]);

        // Normaliser le code en majuscules si fourni
        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $taxe->update($validated);

        Audit::log('update', 'taxe', "Taxe {$taxe->code} mise à jour", [
            'id' => $taxe->id,
            'changes' => $validated,
        ]);

        return response()->json([
            'message' => 'Taxe mise à jour avec succès',
            'data' => $taxe->fresh(),
        ]);
    }

    /**
     * Supprimer une taxe
     */
    public function destroy(Taxe $taxe): JsonResponse
    {
        $code = $taxe->code;
        $id = $taxe->id;

        // Vérifier si la taxe est utilisée dans des documents
        // (à implémenter selon les relations)
        
        $taxe->delete();

        Audit::log('delete', 'taxe', "Taxe {$code} supprimée", [
            'id' => $id,
        ]);

        return response()->json([
            'message' => 'Taxe supprimée avec succès',
        ]);
    }

    /**
     * Récupérer uniquement les taxes actives (pour les formulaires)
     */
    public function actives(): JsonResponse
    {
        $taxes = Taxe::active()->ordonne()->get(['id', 'code', 'nom', 'taux', 'active', 'obligatoire']);

        return response()->json([
            'data' => $taxes,
        ]);
    }

    /**
     * Réordonner les taxes
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'ordres' => 'required|array',
            'ordres.*.id' => 'required|exists:taxes,id',
            'ordres.*.ordre' => 'required|integer|min:0',
        ]);

        foreach ($request->ordres as $item) {
            Taxe::where('id', $item['id'])->update(['ordre' => $item['ordre']]);
        }

        Audit::log('reorder', 'taxe', 'Ordre des taxes modifié');

        return response()->json([
            'message' => 'Ordre mis à jour avec succès',
        ]);
    }

    /**
     * Activer/Désactiver une taxe
     */
    public function toggleActive(Taxe $taxe): JsonResponse
    {
        $taxe->update(['active' => !$taxe->active]);

        Audit::log('toggle', 'taxe', "Taxe {$taxe->code} " . ($taxe->active ? 'activée' : 'désactivée'));

        return response()->json([
            'message' => 'Statut de la taxe mis à jour',
            'data' => $taxe->fresh(),
        ]);
    }
}
