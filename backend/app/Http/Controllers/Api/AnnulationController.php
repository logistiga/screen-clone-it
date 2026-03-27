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
use Illuminate\Support\Facades\DB;

/**
 * CRUD Annulations - Avoirs/Remboursements déléguées à AnnulationAvoirController
 */
class AnnulationController extends Controller
{
    protected AnnulationService $annulationService;

    public function __construct(AnnulationService $annulationService)
    {
        $this->annulationService = $annulationService;
    }

    public function index(Request $request): JsonResponse
    {
        $this->synchroniserAnnulationsManquantes();
        $query = Annulation::with(['client']);
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('motif', 'like', "%{$search}%")->orWhere('numero', 'like', "%{$search}%")->orWhere('document_numero', 'like', "%{$search}%")->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }
        if ($request->has('type')) $query->where('type', $request->get('type'));
        if ($request->has('client_id')) $query->where('client_id', $request->get('client_id'));
        if ($request->has('date_debut') && $request->has('date_fin')) $query->whereBetween('date', [$request->get('date_debut'), $request->get('date_fin')]);

        return response()->json(AnnulationResource::collection($query->orderBy('date', 'desc')->paginate($request->get('per_page', 15)))->response()->getData(true));
    }

    protected function synchroniserAnnulationsManquantes(): void
    {
        $ordresAnnules = OrdreTravail::where('statut', 'annule')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))->from('annulations')->whereColumn('annulations.document_id', 'ordres_travail.id')->where('annulations.type', 'ordre');
            })->get();

        foreach ($ordresAnnules as $ordre) {
            $montantHT = (float) ($ordre->montant_ht ?? 0);
            $montant = $ordre->montant_ttc ?? ($montantHT + (float) ($ordre->tva ?? 0) + (float) ($ordre->css ?? 0));
            if ($montant == 0 && $montantHT > 0) $montant = $montantHT;
            Annulation::create(['numero' => Annulation::genererNumero(), 'type' => 'ordre', 'document_id' => $ordre->id, 'document_numero' => $ordre->numero, 'client_id' => $ordre->client_id, 'montant' => $montant, 'date' => $ordre->updated_at ?? now(), 'motif' => 'Annulation enregistrée automatiquement', 'avoir_genere' => false]);
        }

        $facturesAnnulees = Facture::where('statut', 'annulee')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))->from('annulations')->whereColumn('annulations.document_id', 'factures.id')->where('annulations.type', 'facture');
            })->get();

        foreach ($facturesAnnulees as $facture) {
            Annulation::create(['numero' => Annulation::genererNumero(), 'type' => 'facture', 'document_id' => $facture->id, 'document_numero' => $facture->numero, 'client_id' => $facture->client_id, 'montant' => $facture->montant_ttc ?? 0, 'date' => $facture->updated_at ?? now(), 'motif' => 'Annulation enregistrée automatiquement', 'avoir_genere' => true, 'numero_avoir' => Annulation::genererNumeroAvoir(), 'solde_avoir' => $facture->montant_ttc ?? 0]);
        }
    }

    public function show(Annulation $annulation): JsonResponse
    {
        if ($annulation->type === 'facture' && !$annulation->avoir_genere) {
            DB::transaction(function () use ($annulation) {
                $annulation->update(['avoir_genere' => true, 'numero_avoir' => Annulation::genererNumeroAvoir(), 'solde_avoir' => $annulation->montant]);
            });
            $annulation->refresh();
        }
        $annulation->load(['client']);
        return response()->json(new AnnulationResource($annulation));
    }

    public function annulerFacture(Request $request, Facture $facture): JsonResponse
    {
        $request->validate(['motif' => 'required|string|max:500', 'generer_avoir' => 'boolean']);
        try {
            $annulation = $this->annulationService->annulerFacture($facture, $request->motif, $request->boolean('generer_avoir', false));
            Audit::log('cancel', 'facture', "Facture annulée: {$facture->numero}", $facture->id);
            return response()->json(['message' => 'Facture annulée avec succès', 'annulation' => new AnnulationResource($annulation)]);
        } catch (\Exception $e) { return response()->json(['message' => $e->getMessage()], 422); }
        catch (\Throwable $e) { return response()->json(['message' => 'Erreur serveur', 'error' => $e->getMessage()], 500); }
    }

    public function annulerOrdre(Request $request, $ordre): JsonResponse
    {
        $request->validate(['motif' => 'required|string|max:500']);
        try {
            $ordreModel = OrdreTravail::findOrFail((int) $ordre);
            $annulation = $this->annulationService->annulerOrdre($ordreModel, $request->motif);
            Audit::log('cancel', 'ordre', "Ordre annulé: {$ordreModel->numero}", $ordreModel->id);
            return response()->json(['message' => 'Ordre de travail annulé avec succès', 'annulation' => new AnnulationResource($annulation)]);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'Erreur base de données', 'error' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage(), 'error' => $e->getMessage()], 422);
        }
    }

    public function annulerDevis(Request $request, Devis $devis): JsonResponse
    {
        $request->validate(['motif' => 'required|string|max:500']);
        try {
            $annulation = $this->annulationService->annulerDevis($devis, $request->motif);
            Audit::log('cancel', 'devis', "Devis annulé: {$devis->numero}", $devis->id);
            return response()->json(['message' => 'Devis annulé avec succès', 'annulation' => new AnnulationResource($annulation)]);
        } catch (\Exception $e) { return response()->json(['message' => $e->getMessage()], 422); }
        catch (\Throwable $e) { return response()->json(['message' => 'Erreur serveur', 'error' => $e->getMessage()], 500); }
    }

    // === Délégation avoirs/remboursements ===
    public function genererAvoir(int $id): JsonResponse { return app(AnnulationAvoirController::class)->genererAvoir($id); }
    public function rembourser(Request $r, int $id): JsonResponse { return app(AnnulationAvoirController::class)->rembourser($r, $id); }
    public function avoirsClient(int $clientId): JsonResponse { return app(AnnulationAvoirController::class)->avoirsClient($clientId); }
    public function utiliserAvoir(Request $r, int $id): JsonResponse { return app(AnnulationAvoirController::class)->utiliserAvoir($r, $id); }
    public function ensureAvoirFacture(Facture $facture): JsonResponse { return app(AnnulationAvoirController::class)->ensureAvoirFacture($facture); }

    public function stats(Request $request): JsonResponse
    {
        return response()->json($this->annulationService->getStatistiques([
            'date_debut' => $request->get('date_debut', now()->startOfYear()),
            'date_fin' => $request->get('date_fin', now()->endOfYear()),
            'type' => $request->get('type'),
        ]));
    }

    public function historiqueClient(int $clientId): JsonResponse
    {
        return response()->json($this->annulationService->getHistoriqueClient($clientId));
    }
}
