<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnnulationResource;
use App\Models\Annulation;
use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Models\Devis;
use App\Models\Audit;
use App\Services\AnnulationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
