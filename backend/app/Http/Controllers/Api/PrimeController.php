<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrimeRequest;
use App\Http\Requests\PayerPrimeRequest;
use App\Http\Resources\PrimeResource;
use App\Http\Resources\PaiementPrimeResource;
use App\Models\Prime;
use App\Models\PaiementPrime;
use App\Models\MouvementCaisse;
use App\Models\Audit;
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

        return response()->json(PrimeResource::collection($primes)->response()->getData(true));
    }

    public function store(StorePrimeRequest $request): JsonResponse
    {
        $prime = Prime::create([
            'representant_id' => $request->representant_id,
            'facture_id' => $request->facture_id,
            'montant' => $request->montant,
            'description' => $request->description,
            'statut' => 'En attente',
        ]);

        Audit::log('create', 'prime', "Prime créée: {$request->montant}", $prime->id);

        return response()->json(new PrimeResource($prime->load(['representant', 'facture'])), 201);
    }

    public function show(Prime $prime): JsonResponse
    {
        $prime->load(['representant', 'facture', 'paiements']);
        return response()->json(new PrimeResource($prime));
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

        Audit::log('update', 'prime', "Prime modifiée: {$prime->montant}", $prime->id);

        return response()->json(new PrimeResource($prime->load(['representant', 'facture'])));
    }

    public function destroy(Prime $prime): JsonResponse
    {
        if ($prime->paiements()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer une prime avec des paiements'
            ], 422);
        }

        Audit::log('delete', 'prime', "Prime supprimée: {$prime->montant}", $prime->id);

        $prime->delete();

        return response()->json(['message' => 'Prime supprimée avec succès']);
    }

    public function payer(PayerPrimeRequest $request, Prime $prime): JsonResponse
    {
        // Charger les relations nécessaires
        $prime->load(['transitaire', 'representant']);
        
        // Calculer le montant déjà payé via la table pivot
        $montantPaye = $prime->paiements()->sum('paiements_primes.montant');
        $resteAPayer = $prime->montant - $montantPaye;

        if ($request->montant > $resteAPayer) {
            return response()->json([
                'message' => 'Le montant dépasse le reste à payer',
                'reste_a_payer' => $resteAPayer
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Créer le paiement avec les bonnes colonnes
            $paiement = PaiementPrime::create([
                'transitaire_id' => $prime->transitaire_id,
                'representant_id' => $prime->representant_id,
                'montant' => $request->montant,
                'date' => now()->toDateString(),
                'mode_paiement' => $request->mode_paiement,
                'reference' => $request->reference,
                'notes' => $request->notes,
            ]);

            // Lier le paiement à la prime via la table pivot
            DB::table('paiement_prime_items')->insert([
                'paiement_prime_id' => $paiement->id,
                'prime_id' => $prime->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Créer le mouvement de caisse si paiement en espèces
            if ($request->mode_paiement === 'Espèces') {
                $beneficiaire = $prime->transitaire 
                    ? $prime->transitaire->nom 
                    : ($prime->representant ? "{$prime->representant->nom} {$prime->representant->prenom}" : 'N/A');
                    
                MouvementCaisse::create([
                    'type' => 'Sortie',
                    'categorie' => $prime->transitaire_id ? 'Prime transitaire' : 'Prime représentant',
                    'montant' => $request->montant,
                    'description' => "Prime - {$beneficiaire}",
                    'reference' => $paiement->id,
                    'date_mouvement' => now(),
                    'user_id' => auth()->id(),
                ]);
            }

            // Mettre à jour le statut de la prime
            $nouveauMontantPaye = $montantPaye + $request->montant;
            if ($nouveauMontantPaye >= $prime->montant) {
                $prime->update(['statut' => 'Payée', 'date_paiement' => now()]);
            } else {
                $prime->update(['statut' => 'Partiellement payée']);
            }

            Audit::log('create', 'paiement_prime', "Paiement prime: {$request->montant}", $paiement->id);

            DB::commit();

            return response()->json(new PaiementPrimeResource($paiement), 201);

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
