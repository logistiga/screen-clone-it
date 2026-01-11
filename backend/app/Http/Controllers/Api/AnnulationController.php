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
    public function genererAvoir(Annulation $annulation): JsonResponse
    {
        if ($annulation->avoir_genere) {
            return response()->json(['message' => 'Un avoir a déjà été généré pour cette annulation.'], 422);
        }

        try {
            DB::transaction(function () use ($annulation) {
                $numeroAvoir = Annulation::genererNumeroAvoir();
                $annulation->update([
                    'avoir_genere' => true,
                    'numero_avoir' => $numeroAvoir,
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
    public function rembourser(Request $request, Annulation $annulation): JsonResponse
    {
        $request->validate([
            'montant' => 'required|numeric|min:0.01|max:' . $annulation->montant,
            'mode_paiement' => 'required|string|in:especes,cheque,virement,carte',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            DB::transaction(function () use ($request, $annulation) {
                // Créer le mouvement de caisse (sortie = remboursement)
                MouvementCaisse::create([
                    'type' => 'sortie',
                    'montant' => $request->montant,
                    'date' => now(),
                    'description' => "Remboursement - Annulation {$annulation->numero}",
                    'source' => $request->banque_id ? 'banque' : 'caisse',
                    'banque_id' => $request->banque_id,
                    'mode_paiement' => $request->mode_paiement,
                    'reference' => $request->reference,
                    'client_id' => $annulation->client_id,
                ]);

                // Mettre à jour le solde bancaire si applicable
                if ($request->banque_id) {
                    Banque::find($request->banque_id)->decrement('solde', $request->montant);
                }
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
