<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnulationResource;
use App\Models\Annulation;
use App\Models\Facture;
use App\Models\MouvementCaisse;
use App\Models\Banque;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Gestion des avoirs, remboursements et utilisation d'avoirs
 */
class AnnulationAvoirController extends Controller
{
    public function genererAvoir(int $id): JsonResponse
    {
        $annulation = Annulation::find($id);
        
        if (!$annulation) {
            return response()->json(['message' => 'Annulation non trouvée.'], 404);
        }

        if ($annulation->avoir_genere) {
            return response()->json(['message' => 'Un avoir a déjà été généré pour cette annulation.'], 422);
        }

        try {
            DB::transaction(function () use ($annulation) {
                $numeroAvoir = Annulation::genererNumeroAvoir();
                $annulation->update([
                    'avoir_genere' => true,
                    'numero_avoir' => $numeroAvoir,
                    'solde_avoir' => $annulation->montant,
                ]);
            });

            Audit::log('create', 'avoir', "Avoir généré: {$annulation->numero_avoir}", $annulation->id);

            return response()->json([
                'message' => 'Avoir généré avec succès',
                'numero_avoir' => $annulation->numero_avoir,
                'annulation' => new AnnulationResource($annulation->fresh(['client'])),
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function rembourser(Request $request, int $id): JsonResponse
    {
        $annulation = Annulation::with('client')->find($id);
        
        if (!$annulation) {
            return response()->json(['message' => 'Annulation non trouvée.'], 404);
        }

        $montantMax = $annulation->montant_ttc ?? $annulation->montant ?? 999999999;
        $soldeRestant = $montantMax - ($annulation->montant_rembourse ?? 0);

        $request->validate([
            'montant' => ['required', 'numeric', 'min:0.01', 'max:' . max($soldeRestant, 0.01)],
            'mode_paiement' => 'required|string|in:especes,cheque,virement,carte',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $needsBanque = in_array($request->mode_paiement, ['virement', 'cheque']);
        if ($needsBanque && !$request->banque_id) {
            return response()->json(['message' => 'Une banque est requise pour ce mode de paiement.'], 422);
        }

        try {
            DB::transaction(function () use ($request, $annulation) {
                $source = in_array($request->mode_paiement, ['virement', 'cheque']) ? 'banque' : 'caisse';

                MouvementCaisse::create([
                    'type' => 'sortie',
                    'montant' => $request->montant,
                    'date' => now(),
                    'description' => "Remboursement - Annulation {$annulation->numero} - " . ($annulation->client->nom ?? 'Client'),
                    'source' => $source,
                    'banque_id' => $request->banque_id,
                    'categorie' => 'Remboursement client',
                    'beneficiaire' => $annulation->client->nom ?? 'Client',
                    'mode_paiement' => $request->mode_paiement,
                    'reference' => $request->reference,
                    'client_id' => $annulation->client_id,
                    'annulation_id' => $annulation->id,
                ]);

                if ($request->banque_id) {
                    Banque::find($request->banque_id)->decrement('solde', $request->montant);
                }

                $annulation->update([
                    'rembourse' => true,
                    'montant_rembourse' => ($annulation->montant_rembourse ?? 0) + $request->montant,
                    'date_remboursement' => now(),
                ]);
            });

            Audit::log('create', 'remboursement', "Remboursement effectué: {$request->montant} FCFA - Annulation {$annulation->numero}", $annulation->id);

            return response()->json([
                'message' => 'Remboursement effectué avec succès',
                'montant' => $request->montant,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function avoirsClient(int $clientId): JsonResponse
    {
        $avoirs = Annulation::with(['client'])
            ->where('client_id', $clientId)
            ->where('avoir_genere', true)
            ->orderBy('date', 'desc')
            ->get();

        $soldeTotal = $avoirs->sum('solde_avoir');

        return response()->json([
            'avoirs' => AnnulationResource::collection($avoirs),
            'total_avoirs' => $avoirs->count(),
            'solde_total' => $soldeTotal,
        ]);
    }

    public function utiliserAvoir(Request $request, int $id): JsonResponse
    {
        $annulation = Annulation::find($id);
        
        if (!$annulation) {
            return response()->json(['message' => 'Annulation non trouvée.'], 404);
        }

        $request->validate([
            'facture_id' => 'nullable|exists:factures,id',
            'ordre_id' => 'nullable|exists:ordres_travail,id',
            'montant' => 'required|numeric|min:0.01',
        ]);

        if (!$request->filled('facture_id') && !$request->filled('ordre_id')) {
            return response()->json(['message' => 'facture_id ou ordre_id est requis.'], 422);
        }

        if (!$annulation->avoir_genere) {
            return response()->json(['message' => 'Aucun avoir n\'a été généré pour cette annulation.'], 422);
        }

        if ($request->montant > $annulation->solde_avoir) {
            return response()->json(['message' => 'Le montant dépasse le solde de l\'avoir disponible.'], 422);
        }

        try {
            $facture = $request->filled('facture_id')
                ? \App\Models\Facture::findOrFail($request->facture_id)
                : null;

            $ordre = $request->filled('ordre_id')
                ? \App\Models\OrdreTravail::findOrFail($request->ordre_id)
                : null;

            DB::transaction(function () use ($request, $annulation, $facture, $ordre) {
                \App\Models\Paiement::create([
                    'facture_id' => $facture?->id,
                    'ordre_id' => $ordre?->id,
                    'client_id' => $facture?->client_id ?? $ordre?->client_id,
                    'montant' => $request->montant,
                    'date' => now(),
                    'mode_paiement' => 'Avoir',
                    'reference' => $annulation->numero_avoir,
                    'notes' => "Paiement par avoir {$annulation->numero_avoir}",
                ]);

                if ($facture) {
                    $facture->increment('montant_paye', $request->montant);
                    if ($facture->montant_paye >= $facture->montant_ttc) {
                        $facture->update(['statut' => 'payee']);
                    } else {
                        $facture->update(['statut' => 'partielle']);
                    }
                }

                if ($ordre) {
                    $ordre->increment('montant_paye', $request->montant);
                    if ($ordre->montant_paye >= $ordre->montant_ttc) {
                        $ordre->update(['statut' => 'termine']);
                    }
                }

                $annulation->decrement('solde_avoir', $request->montant);
            });

            $docNumero = $facture?->numero ?? $ordre?->numero ?? '';
            $docType = $facture ? 'Facture' : 'Ordre';

            Audit::log('create', 'paiement_avoir', "Paiement par avoir: {$request->montant} FCFA - {$docType} {$docNumero}", $facture?->id ?? $ordre?->id);

            return response()->json([
                'message' => 'Avoir utilisé avec succès',
                'montant_utilise' => $request->montant,
                'solde_avoir_restant' => $annulation->fresh()->solde_avoir,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function ensureAvoirFacture(Facture $facture): JsonResponse
    {
        if ($facture->statut !== 'annulee') {
            return response()->json(['message' => 'Cette facture n\'est pas annulée.'], 422);
        }

        try {
            $annulation = Annulation::where('document_id', $facture->id)
                ->where('type', 'facture')
                ->first();

            if (!$annulation) {
                $annulation = Annulation::create([
                    'numero' => Annulation::genererNumero(),
                    'type' => 'facture',
                    'document_id' => $facture->id,
                    'document_numero' => $facture->numero,
                    'client_id' => $facture->client_id,
                    'montant' => $facture->montant_ttc ?? 0,
                    'date' => $facture->updated_at ?? now(),
                    'motif' => 'Annulation enregistrée automatiquement',
                    'avoir_genere' => true,
                    'numero_avoir' => Annulation::genererNumeroAvoir(),
                    'solde_avoir' => $facture->montant_ttc ?? 0,
                ]);
            } elseif (!$annulation->avoir_genere) {
                DB::transaction(function () use ($annulation) {
                    $annulation->update([
                        'avoir_genere' => true,
                        'numero_avoir' => Annulation::genererNumeroAvoir(),
                        'solde_avoir' => $annulation->montant,
                    ]);
                });
                $annulation->refresh();
            }

            $annulation->load('client');

            return response()->json([
                'message' => 'Avoir disponible',
                'annulation' => new AnnulationResource($annulation),
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
