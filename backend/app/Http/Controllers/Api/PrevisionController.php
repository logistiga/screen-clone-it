<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrevisionRequest;
use App\Http\Requests\UpdatePrevisionRequest;
use App\Http\Resources\PrevisionResource;
use App\Models\Prevision;
use App\Models\Audit;
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

        return response()->json(PrevisionResource::collection($previsions)->response()->getData(true));
    }

    public function store(StorePrevisionRequest $request): JsonResponse
    {
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

        Audit::log('create', 'prevision', "Prévision créée: {$request->type} - {$request->categorie}", $prevision->id);

        return response()->json(new PrevisionResource($prevision), 201);
    }

    public function show(Prevision $prevision): JsonResponse
    {
        $prevision->load('user');
        return response()->json(new PrevisionResource($prevision));
    }

    public function update(UpdatePrevisionRequest $request, Prevision $prevision): JsonResponse
    {
        $prevision->update($request->validated());

        if ($request->has('montant_realise')) {
            if ($prevision->montant_realise >= $prevision->montant_prevu) {
                $prevision->update(['statut' => 'Atteint']);
            }
        }

        Audit::log('update', 'prevision', "Prévision modifiée", $prevision->id);

        return response()->json(new PrevisionResource($prevision));
    }

    public function destroy(Prevision $prevision): JsonResponse
    {
        Audit::log('delete', 'prevision', "Prévision supprimée", $prevision->id);

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

        return response()->json(new PrevisionResource($prevision));
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
