<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Contrôleur pour l'auto-complétion des descriptions de marchandises.
 * Recherche dans les lots (conventionnel) et conteneurs (conteneurisé).
 */
class DescriptionSuggestionController extends Controller
{
    /**
     * Rechercher des descriptions existantes par terme (LIKE).
     * 
     * GET /api/descriptions/suggestions?q=transport&type=all&limit=10
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:200',
            'type' => 'nullable|in:lot,conteneur,all',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $query = trim($request->input('q'));
        $type = $request->input('type', 'all');
        $limit = $request->input('limit', 10);

        $suggestions = collect();

        // Recherche dans les lots (ordres conventionnels)
        if (in_array($type, ['lot', 'all'])) {
            $lotDescriptions = DB::table('lots')
                ->whereNotNull('description')
                ->where('description', '!=', '')
                ->where('description', 'LIKE', "%{$query}%")
                ->select('description')
                ->distinct()
                ->limit($limit)
                ->pluck('description');

            $suggestions = $suggestions->merge($lotDescriptions);
        }

        // Recherche dans les conteneurs
        if (in_array($type, ['conteneur', 'all'])) {
            $conteneurDescriptions = DB::table('conteneur_ordres')
                ->whereNotNull('description')
                ->where('description', '!=', '')
                ->where('description', 'LIKE', "%{$query}%")
                ->select('description')
                ->distinct()
                ->limit($limit)
                ->pluck('description');

            $suggestions = $suggestions->merge($conteneurDescriptions);
        }

        // Dédupliquer, trier et limiter
        $results = $suggestions
            ->unique()
            ->sort()
            ->take($limit)
            ->values();

        return response()->json([
            'suggestions' => $results,
        ]);
    }
}
