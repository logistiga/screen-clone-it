<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prevision;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class PrevisionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Prevision::with('user');

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->has('mois') && $request->has('annee')) {
            $query->where('mois', $request->get('mois'))
                  ->where('annee', $request->get('annee'));
        }

        if ($request->has('annee')) {
            $query->where('annee', $request->get('annee'));
        }

        $previsions = $query->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($previsions);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:Recette,Dépense',
            'categorie' => 'required|string|max:100',
            'description' => 'required|string|max:500',
            'montant_prevu' => 'required|numeric|min:0',
            'mois' => 'required|integer|min:1|max:12',
            'annee' => 'required|integer|min:2020',
            'date_prevue' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Vérifier si une prévision similaire existe déjà
        $exists = Prevision::where('type', $request->type)
            ->where('categorie', $request->categorie)
            ->where('mois', $request->mois)
            ->where('annee', $request->annee)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Une prévision similaire existe déjà pour ce mois'
            ], 422);
        }

        $prevision = Prevision::create([
            'type' => $request->type,
            'categorie' => $request->categorie,
            'description' => $request->description,
            'montant_prevu' => $request->montant_prevu,
            'montant_realise' => 0,
            'mois' => $request->mois,
            'annee' => $request->annee,
            'date_prevue' => $request->date_prevue,
            'statut' => 'En cours',
            'user_id' => auth()->id(),
        ]);

        return response()->json($prevision, 201);
    }

    public function show(Prevision $prevision): JsonResponse
    {
        $prevision->load('user');
        $prevision->ecart = $prevision->montant_realise - $prevision->montant_prevu;
        $prevision->taux_realisation = $prevision->montant_prevu > 0 
            ? round(($prevision->montant_realise / $prevision->montant_prevu) * 100, 2) 
            : 0;

        return response()->json($prevision);
    }

    public function update(Request $request, Prevision $prevision): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'description' => 'sometimes|required|string|max:500',
            'montant_prevu' => 'sometimes|required|numeric|min:0',
            'montant_realise' => 'sometimes|numeric|min:0',
            'date_prevue' => 'nullable|date',
            'statut' => 'sometimes|in:En cours,Atteint,Non atteint',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $prevision->update($request->all());

        // Mettre à jour le statut automatiquement
        if ($request->has('montant_realise')) {
            if ($prevision->montant_realise >= $prevision->montant_prevu) {
                $prevision->update(['statut' => 'Atteint']);
            }
        }

        return response()->json($prevision);
    }

    public function destroy(Prevision $prevision): JsonResponse
    {
        $prevision->delete();
        return response()->json(['message' => 'Prévision supprimée avec succès']);
    }

    public function updateRealise(Request $request, Prevision $prevision): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'montant' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $nouveauMontant = $prevision->montant_realise + $request->montant;
        $prevision->update([
            'montant_realise' => $nouveauMontant,
            'statut' => $nouveauMontant >= $prevision->montant_prevu ? 'Atteint' : 'En cours',
        ]);

        return response()->json($prevision);
    }

    public function stats(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        $stats = [
            'recettes' => [
                'prevu' => Prevision::where('type', 'Recette')
                    ->where('annee', $annee)
                    ->sum('montant_prevu'),
                'realise' => Prevision::where('type', 'Recette')
                    ->where('annee', $annee)
                    ->sum('montant_realise'),
            ],
            'depenses' => [
                'prevu' => Prevision::where('type', 'Dépense')
                    ->where('annee', $annee)
                    ->sum('montant_prevu'),
                'realise' => Prevision::where('type', 'Dépense')
                    ->where('annee', $annee)
                    ->sum('montant_realise'),
            ],
            'par_mois' => Prevision::where('annee', $annee)
                ->selectRaw('mois, type, SUM(montant_prevu) as prevu, SUM(montant_realise) as realise')
                ->groupBy('mois', 'type')
                ->orderBy('mois')
                ->get(),
            'par_categorie' => Prevision::where('annee', $annee)
                ->selectRaw('categorie, type, SUM(montant_prevu) as prevu, SUM(montant_realise) as realise')
                ->groupBy('categorie', 'type')
                ->get(),
        ];

        return response()->json($stats);
    }

    public function categories(): JsonResponse
    {
        $categories = [
            'Recette' => [
                'Facturation',
                'Paiements clients',
                'Autres recettes',
            ],
            'Dépense' => [
                'Salaires',
                'Loyer',
                'Carburant',
                'Entretien',
                'Fournitures',
                'Frais bancaires',
                'Impôts et taxes',
                'Remboursement crédit',
                'Primes représentants',
                'Autres dépenses',
            ],
        ];

        return response()->json($categories);
    }
}
