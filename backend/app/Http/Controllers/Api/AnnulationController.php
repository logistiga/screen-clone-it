<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnulationResource;
use App\Models\Annulation;
use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Models\Devis;
use App\Models\Audit;
use App\Models\MouvementCaisse;
use App\Models\Banque;
use App\Services\AnnulationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnnulationController extends Controller
{
    protected AnnulationService $annulationService;

    public function __construct(AnnulationService $annulationService)
    {
        $this->annulationService = $annulationService;
    }

    public function index(Request $request): JsonResponse
    {
        // Synchroniser automatiquement les documents annulés sans enregistrement
        $this->synchroniserAnnulationsManquantes();

        $query = Annulation::with(['client']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('motif', 'like', "%{$search}%")
                  ->orWhere('numero', 'like', "%{$search}%")
                  ->orWhere('document_numero', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->get('client_id'));
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $annulations = $query->orderBy('date', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(AnnulationResource::collection($annulations)->response()->getData(true));
    }

    /**
     * Synchronise automatiquement les documents annulés sans enregistrement d'annulation
     */
    protected function synchroniserAnnulationsManquantes(): void
    {
        // Ordres annulés sans enregistrement d'annulation
        $ordresAnnules = OrdreTravail::where('statut', 'annule')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('annulations')
                    ->whereColumn('annulations.document_id', 'ordres_travail.id')
                    ->where('annulations.type', 'ordre');
            })
            ->get();

        foreach ($ordresAnnules as $ordre) {
            Annulation::create([
                'numero' => Annulation::genererNumero(),
                'type' => 'ordre',
                'document_id' => $ordre->id,
                'document_numero' => $ordre->numero,
                'client_id' => $ordre->client_id,
                'montant' => $ordre->montant_ttc ?? 0,
                'date' => $ordre->updated_at ?? now(),
                'motif' => 'Annulation enregistrée automatiquement',
                'avoir_genere' => false,
            ]);
        }

        // Factures annulées sans enregistrement d'annulation
        $facturesAnnulees = Facture::where('statut', 'annulee')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('annulations')
                    ->whereColumn('annulations.document_id', 'factures.id')
                    ->where('annulations.type', 'facture');
            })
            ->get();

        foreach ($facturesAnnulees as $facture) {
            Annulation::create([
                'numero' => Annulation::genererNumero(),
                'type' => 'facture',
                'document_id' => $facture->id,
                'document_numero' => $facture->numero,
                'client_id' => $facture->client_id,
                'montant' => $facture->montant_ttc ?? 0,
                'date' => $facture->updated_at ?? now(),
                'motif' => 'Annulation enregistrée automatiquement',
                'avoir_genere' => false,
            ]);
        }
    }

    public function show(Annulation $annulation): JsonResponse
    {
        $annulation->load(['client']);
        return response()->json(new AnnulationResource($annulation));
    }

    public function annulerFacture(Request $request, Facture $facture): JsonResponse
    {
        $request->validate([
            'motif' => 'required|string|max:500',
            'generer_avoir' => 'boolean',
        ]);

        try {
            $annulation = $this->annulationService->annulerFacture(
                $facture,
                $request->motif,
                $request->boolean('generer_avoir', false)
            );

            Audit::log('cancel', 'facture', "Facture annulée: {$facture->numero}", $facture->id);

            return response()->json([
                'message' => 'Facture annulée avec succès',
                'annulation' => new AnnulationResource($annulation),
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function annulerOrdre(Request $request, OrdreTravail $ordre): JsonResponse
    {
        $request->validate([
            'motif' => 'required|string|max:500',
        ]);

        try {
            $annulation = $this->annulationService->annulerOrdre($ordre, $request->motif);

            Audit::log('cancel', 'ordre', "Ordre annulé: {$ordre->numero}", $ordre->id);

            return response()->json([
                'message' => 'Ordre de travail annulé avec succès',
                'annulation' => new AnnulationResource($annulation),
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function annulerDevis(Request $request, Devis $devis): JsonResponse
    {
        $request->validate([
            'motif' => 'required|string|max:500',
        ]);

        try {
            $annulation = $this->annulationService->annulerDevis($devis, $request->motif);

            Audit::log('cancel', 'devis', "Devis annulé: {$devis->numero}", $devis->id);

            return response()->json([
                'message' => 'Devis annulé avec succès',
                'annulation' => new AnnulationResource($annulation),
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Générer un avoir pour une annulation existante
     */
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
                    'solde_avoir' => $annulation->montant, // Le solde de l'avoir est égal au montant
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

    /**
     * Rembourser le montant d'une annulation au client
     */
    public function rembourser(Request $request, int $id): JsonResponse
    {
        $annulation = Annulation::with('client')->find($id);
        
        if (!$annulation) {
            return response()->json(['message' => 'Annulation non trouvée.'], 404);
        }

        $request->validate([
            'montant' => 'required|numeric|min:0.01|max:' . $annulation->montant,
            'mode_paiement' => 'required|string|in:especes,cheque,virement,carte',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        // Vérifier si c'est une banque requise
        $needsBanque = in_array($request->mode_paiement, ['virement', 'cheque']);
        if ($needsBanque && !$request->banque_id) {
            return response()->json(['message' => 'Une banque est requise pour ce mode de paiement.'], 422);
        }

        try {
            DB::transaction(function () use ($request, $annulation) {
                // Déterminer la source selon le mode de paiement
                $source = in_array($request->mode_paiement, ['virement', 'cheque']) ? 'banque' : 'caisse';

                // Créer le mouvement de caisse (sortie = remboursement)
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

                // Mettre à jour le solde bancaire si applicable
                if ($request->banque_id) {
                    Banque::find($request->banque_id)->decrement('solde', $request->montant);
                }

                // Marquer l'annulation comme remboursée
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

    /**
     * Récupérer les avoirs d'un client
     */
    public function avoirsClient(int $clientId): JsonResponse
    {
        $avoirs = Annulation::with(['client'])
            ->where('client_id', $clientId)
            ->where('avoir_genere', true)
            ->orderBy('date', 'desc')
            ->get();

        // Calculer le solde total disponible
        $soldeTotal = $avoirs->sum('solde_avoir');

        return response()->json([
            'avoirs' => AnnulationResource::collection($avoirs),
            'total_avoirs' => $avoirs->count(),
            'solde_total' => $soldeTotal,
        ]);
    }

    /**
     * Utiliser un avoir pour payer une facture
     */
    public function utiliserAvoir(Request $request, int $id): JsonResponse
    {
        $annulation = Annulation::find($id);
        
        if (!$annulation) {
            return response()->json(['message' => 'Annulation non trouvée.'], 404);
        }

        $request->validate([
            'facture_id' => 'required|exists:factures,id',
            'montant' => 'required|numeric|min:0.01',
        ]);

        if (!$annulation->avoir_genere) {
            return response()->json(['message' => 'Aucun avoir n\'a été généré pour cette annulation.'], 422);
        }

        if ($request->montant > $annulation->solde_avoir) {
            return response()->json(['message' => 'Le montant dépasse le solde de l\'avoir disponible.'], 422);
        }

        try {
            $facture = \App\Models\Facture::findOrFail($request->facture_id);

            DB::transaction(function () use ($request, $annulation, $facture) {
                // Créer le paiement
                \App\Models\Paiement::create([
                    'facture_id' => $facture->id,
                    'client_id' => $facture->client_id,
                    'montant' => $request->montant,
                    'date' => now(),
                    'mode_paiement' => 'Avoir',
                    'reference' => $annulation->numero_avoir,
                    'notes' => "Paiement par avoir {$annulation->numero_avoir}",
                ]);

                // Mettre à jour le montant payé de la facture
                $facture->increment('montant_paye', $request->montant);

                // Mettre à jour le statut de la facture si entièrement payée
                if ($facture->montant_paye >= $facture->montant_ttc) {
                    $facture->update(['statut' => 'payee']);
                } else {
                    $facture->update(['statut' => 'partielle']);
                }

                // Déduire le montant du solde de l'avoir
                $annulation->decrement('solde_avoir', $request->montant);
            });

            Audit::log('create', 'paiement_avoir', "Paiement par avoir: {$request->montant} FCFA - Facture {$facture->numero}", $facture->id);

            return response()->json([
                'message' => 'Avoir utilisé avec succès',
                'montant_utilise' => $request->montant,
                'solde_avoir_restant' => $annulation->fresh()->solde_avoir,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        $stats = $this->annulationService->getStatistiques([
            'date_debut' => $request->get('date_debut', now()->startOfYear()),
            'date_fin' => $request->get('date_fin', now()->endOfYear()),
            'type' => $request->get('type'),
        ]);

        return response()->json($stats);
    }

    public function historiqueClient(int $clientId): JsonResponse
    {
        $historique = $this->annulationService->getHistoriqueClient($clientId);

        return response()->json($historique);
    }
}
