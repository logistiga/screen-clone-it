<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CaisseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MouvementCaisse::with('user');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('categorie', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('categorie')) {
            $query->where('categorie', $request->get('categorie'));
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date_mouvement', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $mouvements = $query->orderBy('date_mouvement', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($mouvements);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:Entrée,Sortie',
            'categorie' => 'required|string|max:100',
            'montant' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:500',
            'beneficiaire' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Vérifier le solde pour les sorties
        if ($request->type === 'Sortie') {
            $solde = $this->getSoldeActuel();
            if ($request->montant > $solde) {
                return response()->json([
                    'message' => 'Solde insuffisant',
                    'solde_actuel' => $solde
                ], 422);
            }
        }

        $mouvement = MouvementCaisse::create([
            'type' => $request->type,
            'categorie' => $request->categorie,
            'montant' => $request->montant,
            'description' => $request->description,
            'beneficiaire' => $request->beneficiaire,
            'date_mouvement' => now(),
            'user_id' => auth()->id(),
        ]);

        return response()->json($mouvement->load('user'), 201);
    }

    public function show(MouvementCaisse $mouvement): JsonResponse
    {
        $mouvement->load('user');
        return response()->json($mouvement);
    }

    public function destroy(MouvementCaisse $mouvement): JsonResponse
    {
        // Ne pas supprimer les mouvements liés aux paiements
        if ($mouvement->categorie === 'Paiement facture' && $mouvement->reference) {
            return response()->json([
                'message' => 'Ce mouvement est lié à un paiement et ne peut pas être supprimé directement'
            ], 422);
        }

        $mouvement->delete();

        return response()->json(['message' => 'Mouvement supprimé avec succès']);
    }

    public function solde(): JsonResponse
    {
        $solde = $this->getSoldeActuel();
        
        $entrees = MouvementCaisse::where('type', 'Entrée')->sum('montant');
        $sorties = MouvementCaisse::where('type', 'Sortie')->sum('montant');

        return response()->json([
            'solde' => $solde,
            'total_entrees' => $entrees,
            'total_sorties' => $sorties,
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth());
        $dateFin = $request->get('date_fin', now()->endOfMonth());

        $stats = [
            'solde_actuel' => $this->getSoldeActuel(),
            'entrees_periode' => MouvementCaisse::where('type', 'Entrée')
                ->whereBetween('date_mouvement', [$dateDebut, $dateFin])
                ->sum('montant'),
            'sorties_periode' => MouvementCaisse::where('type', 'Sortie')
                ->whereBetween('date_mouvement', [$dateDebut, $dateFin])
                ->sum('montant'),
            'par_categorie' => MouvementCaisse::whereBetween('date_mouvement', [$dateDebut, $dateFin])
                ->selectRaw('type, categorie, SUM(montant) as total, COUNT(*) as nombre')
                ->groupBy('type', 'categorie')
                ->get(),
            'par_jour' => MouvementCaisse::whereBetween('date_mouvement', [$dateDebut, $dateFin])
                ->selectRaw('DATE(date_mouvement) as date, type, SUM(montant) as total')
                ->groupBy('date', 'type')
                ->orderBy('date')
                ->get(),
        ];

        return response()->json($stats);
    }

    public function categories(): JsonResponse
    {
        $categories = [
            'Entrée' => [
                'Paiement facture',
                'Avance client',
                'Remboursement',
                'Autre entrée',
            ],
            'Sortie' => [
                'Frais de port',
                'Frais de douane',
                'Transport',
                'Manutention',
                'Salaires',
                'Carburant',
                'Fournitures',
                'Entretien',
                'Prime représentant',
                'Autre sortie',
            ],
        ];

        return response()->json($categories);
    }

    private function getSoldeActuel(): float
    {
        $entrees = MouvementCaisse::where('type', 'Entrée')->sum('montant');
        $sorties = MouvementCaisse::where('type', 'Sortie')->sum('montant');
        return $entrees - $sorties;
    }
}
