<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Facture;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PaiementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Paiement::with(['facture.client', 'client', 'banque']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('facture', fn($q) => $q->where('numero', 'like', "%{$search}%"))
                  ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }

        if ($request->has('mode_paiement')) {
            $query->where('mode_paiement', $request->get('mode_paiement'));
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->get('client_id'));
        }

        if ($request->has('facture_id')) {
            $query->where('facture_id', $request->get('facture_id'));
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date_paiement', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $paiements = $query->orderBy('date_paiement', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($paiements);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'facture_id' => 'required|exists:factures,id',
            'montant' => 'required|numeric|min:0.01',
            'mode_paiement' => 'required|in:Espèces,Chèque,Virement,Mobile Money',
            'reference' => 'nullable|string|max:100',
            'banque_id' => 'nullable|exists:banques,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $facture = Facture::with('paiements')->findOrFail($request->facture_id);
        
        $montantPaye = $facture->paiements->sum('montant');
        $resteAPayer = $facture->montant_ttc - $montantPaye;

        if ($request->montant > $resteAPayer) {
            return response()->json([
                'message' => 'Le montant du paiement dépasse le reste à payer',
                'reste_a_payer' => $resteAPayer
            ], 422);
        }

        try {
            DB::beginTransaction();

            $paiement = Paiement::create([
                'facture_id' => $request->facture_id,
                'client_id' => $facture->client_id,
                'montant' => $request->montant,
                'mode_paiement' => $request->mode_paiement,
                'reference' => $request->reference,
                'banque_id' => $request->banque_id,
                'date_paiement' => now(),
                'notes' => $request->notes,
                'user_id' => auth()->id(),
            ]);

            // Créer le mouvement de caisse si paiement en espèces
            if ($request->mode_paiement === 'Espèces') {
                MouvementCaisse::create([
                    'type' => 'Entrée',
                    'categorie' => 'Paiement facture',
                    'montant' => $request->montant,
                    'description' => "Paiement facture {$facture->numero}",
                    'reference' => $paiement->id,
                    'date_mouvement' => now(),
                    'user_id' => auth()->id(),
                ]);
            }

            // Mettre à jour le statut de la facture
            $nouveauMontantPaye = $montantPaye + $request->montant;
            if ($nouveauMontantPaye >= $facture->montant_ttc) {
                $facture->update(['statut' => 'Payée']);
            } else {
                $facture->update(['statut' => 'Partiellement payée']);
            }

            DB::commit();

            return response()->json($paiement->load(['facture', 'client', 'banque']), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'enregistrement', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Paiement $paiement): JsonResponse
    {
        $paiement->load(['facture.client', 'client', 'banque']);
        return response()->json($paiement);
    }

    public function destroy(Paiement $paiement): JsonResponse
    {
        try {
            DB::beginTransaction();

            $facture = $paiement->facture;

            // Supprimer le mouvement de caisse associé
            MouvementCaisse::where('reference', $paiement->id)
                ->where('categorie', 'Paiement facture')
                ->delete();

            $paiement->delete();

            // Recalculer le statut de la facture
            $montantPaye = $facture->paiements()->sum('montant');
            if ($montantPaye <= 0) {
                $facture->update(['statut' => 'Envoyée']);
            } elseif ($montantPaye < $facture->montant_ttc) {
                $facture->update(['statut' => 'Partiellement payée']);
            }

            DB::commit();

            return response()->json(['message' => 'Paiement supprimé avec succès']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la suppression', 'error' => $e->getMessage()], 500);
        }
    }

    public function paiementGlobal(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'montant' => 'required|numeric|min:0.01',
            'mode_paiement' => 'required|in:Espèces,Chèque,Virement,Mobile Money',
            'reference' => 'nullable|string|max:100',
            'banque_id' => 'nullable|exists:banques,id',
            'factures' => 'required|array|min:1',
            'factures.*.id' => 'required|exists:factures,id',
            'factures.*.montant' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $totalRepartition = collect($request->factures)->sum('montant');
        if (abs($totalRepartition - $request->montant) > 0.01) {
            return response()->json([
                'message' => 'La somme des montants répartis ne correspond pas au montant total'
            ], 422);
        }

        try {
            DB::beginTransaction();

            $paiements = [];

            foreach ($request->factures as $factureData) {
                if ($factureData['montant'] <= 0) continue;

                $facture = Facture::with('paiements')->findOrFail($factureData['id']);
                
                $montantPaye = $facture->paiements->sum('montant');
                $resteAPayer = $facture->montant_ttc - $montantPaye;

                if ($factureData['montant'] > $resteAPayer) {
                    throw new \Exception("Montant trop élevé pour la facture {$facture->numero}");
                }

                $paiement = Paiement::create([
                    'facture_id' => $facture->id,
                    'client_id' => $request->client_id,
                    'montant' => $factureData['montant'],
                    'mode_paiement' => $request->mode_paiement,
                    'reference' => $request->reference,
                    'banque_id' => $request->banque_id,
                    'date_paiement' => now(),
                    'notes' => 'Paiement global',
                    'user_id' => auth()->id(),
                ]);

                $paiements[] = $paiement;

                // Mouvement de caisse si espèces
                if ($request->mode_paiement === 'Espèces') {
                    MouvementCaisse::create([
                        'type' => 'Entrée',
                        'categorie' => 'Paiement facture',
                        'montant' => $factureData['montant'],
                        'description' => "Paiement global - Facture {$facture->numero}",
                        'reference' => $paiement->id,
                        'date_mouvement' => now(),
                        'user_id' => auth()->id(),
                    ]);
                }

                // Mettre à jour le statut
                $nouveauMontantPaye = $montantPaye + $factureData['montant'];
                if ($nouveauMontantPaye >= $facture->montant_ttc) {
                    $facture->update(['statut' => 'Payée']);
                } else {
                    $facture->update(['statut' => 'Partiellement payée']);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Paiement global enregistré avec succès',
                'paiements' => $paiements
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'enregistrement', 'error' => $e->getMessage()], 500);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth());
        $dateFin = $request->get('date_fin', now()->endOfMonth());

        $stats = [
            'total' => Paiement::whereBetween('date_paiement', [$dateDebut, $dateFin])->sum('montant'),
            'par_mode' => Paiement::whereBetween('date_paiement', [$dateDebut, $dateFin])
                ->selectRaw('mode_paiement, SUM(montant) as total, COUNT(*) as nombre')
                ->groupBy('mode_paiement')
                ->get(),
            'par_jour' => Paiement::whereBetween('date_paiement', [$dateDebut, $dateFin])
                ->selectRaw('DATE(date_paiement) as date, SUM(montant) as total')
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
        ];

        return response()->json($stats);
    }
}
