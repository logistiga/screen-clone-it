<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prime;
use App\Models\PaiementPrime;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PrimeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Prime::with(['representant', 'facture', 'paiements']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('representant', fn($q) => $q->where('nom', 'like', "%{$search}%"))
                  ->orWhereHas('facture', fn($q) => $q->where('numero', 'like', "%{$search}%"));
            });
        }

        if ($request->has('representant_id')) {
            $query->where('representant_id', $request->get('representant_id'));
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('created_at', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $primes = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        // Calculer les montants payés
        $primes->getCollection()->transform(function ($prime) {
            $prime->montant_paye = $prime->paiements->sum('montant');
            $prime->reste_a_payer = $prime->montant - $prime->montant_paye;
            return $prime;
        });

        return response()->json($primes);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'representant_id' => 'required|exists:representants,id',
            'facture_id' => 'nullable|exists:factures,id',
            'montant' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $prime = Prime::create([
            'representant_id' => $request->representant_id,
            'facture_id' => $request->facture_id,
            'montant' => $request->montant,
            'description' => $request->description,
            'statut' => 'En attente',
        ]);

        return response()->json($prime->load(['representant', 'facture']), 201);
    }

    public function show(Prime $prime): JsonResponse
    {
        $prime->load(['representant', 'facture', 'paiements']);
        $prime->montant_paye = $prime->paiements->sum('montant');
        $prime->reste_a_payer = $prime->montant - $prime->montant_paye;

        return response()->json($prime);
    }

    public function update(Request $request, Prime $prime): JsonResponse
    {
        if ($prime->statut === 'Payée') {
            return response()->json(['message' => 'Impossible de modifier une prime payée'], 422);
        }

        $validator = Validator::make($request->all(), [
            'montant' => 'sometimes|required|numeric|min:0.01',
            'description' => 'nullable|string|max:500',
            'statut' => 'sometimes|in:En attente,Partiellement payée,Payée,Annulée',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $prime->update($request->all());

        return response()->json($prime->load(['representant', 'facture']));
    }

    public function destroy(Prime $prime): JsonResponse
    {
        if ($prime->paiements()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer une prime avec des paiements'
            ], 422);
        }

        $prime->delete();

        return response()->json(['message' => 'Prime supprimée avec succès']);
    }

    public function payer(Request $request, Prime $prime): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'montant' => 'required|numeric|min:0.01',
            'mode_paiement' => 'required|in:Espèces,Chèque,Virement,Mobile Money',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $montantPaye = $prime->paiements()->sum('montant');
        $resteAPayer = $prime->montant - $montantPaye;

        if ($request->montant > $resteAPayer) {
            return response()->json([
                'message' => 'Le montant dépasse le reste à payer',
                'reste_a_payer' => $resteAPayer
            ], 422);
        }

        try {
            DB::beginTransaction();

            $paiement = PaiementPrime::create([
                'prime_id' => $prime->id,
                'montant' => $request->montant,
                'mode_paiement' => $request->mode_paiement,
                'reference' => $request->reference,
                'date_paiement' => now(),
                'notes' => $request->notes,
                'user_id' => auth()->id(),
            ]);

            // Mouvement de caisse si espèces
            if ($request->mode_paiement === 'Espèces') {
                MouvementCaisse::create([
                    'type' => 'Sortie',
                    'categorie' => 'Prime représentant',
                    'montant' => $request->montant,
                    'description' => "Prime - {$prime->representant->nom} {$prime->representant->prenom}",
                    'reference' => $paiement->id,
                    'date_mouvement' => now(),
                    'user_id' => auth()->id(),
                ]);
            }

            // Mettre à jour le statut
            $nouveauMontantPaye = $montantPaye + $request->montant;
            if ($nouveauMontantPaye >= $prime->montant) {
                $prime->update(['statut' => 'Payée']);
            } else {
                $prime->update(['statut' => 'Partiellement payée']);
            }

            DB::commit();

            return response()->json($paiement, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors du paiement', 'error' => $e->getMessage()], 500);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth());
        $dateFin = $request->get('date_fin', now()->endOfMonth());

        $stats = [
            'total_primes' => Prime::whereBetween('created_at', [$dateDebut, $dateFin])->sum('montant'),
            'total_payees' => PaiementPrime::whereBetween('date_paiement', [$dateDebut, $dateFin])->sum('montant'),
            'en_attente' => Prime::where('statut', 'En attente')->sum('montant'),
            'par_representant' => Prime::whereBetween('created_at', [$dateDebut, $dateFin])
                ->with('representant')
                ->selectRaw('representant_id, SUM(montant) as total')
                ->groupBy('representant_id')
                ->get(),
        ];

        return response()->json($stats);
    }
}
