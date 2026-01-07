<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportingController extends Controller
{
    protected ReportingService $reportingService;

    public function __construct(ReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
    }

    public function dashboard(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        $data = $this->reportingService->getTableauDeBord((int) $annee);
        return response()->json($data);
    }

    public function chiffreAffaires(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        $mois = $request->get('mois');
        
        $data = $this->reportingService->getChiffreAffaires((int) $annee, $mois ? (int) $mois : null);
        return response()->json($data);
    }

    public function rentabilite(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        $data = $this->reportingService->getRentabilite((int) $annee);
        return response()->json($data);
    }

    public function creances(Request $request): JsonResponse
    {
        $data = $this->reportingService->getCreances();
        return response()->json($data);
    }

    public function tresorerie(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth()->toDateString());
        $dateFin = $request->get('date_fin', now()->endOfMonth()->toDateString());

        $data = $this->reportingService->getTresorerie($dateDebut, $dateFin);
        return response()->json($data);
    }

    public function comparatif(Request $request): JsonResponse
    {
        $annee1 = $request->get('annee1', date('Y') - 1);
        $annee2 = $request->get('annee2', date('Y'));

        $data = $this->reportingService->getComparatif((int) $annee1, (int) $annee2);
        return response()->json($data);
    }

    public function activiteClients(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfYear()->toDateString());
        $dateFin = $request->get('date_fin', now()->endOfYear()->toDateString());
        $limit = $request->get('limit', 20);

        $data = $this->reportingService->getActiviteClients($dateDebut, $dateFin, (int) $limit);
        return response()->json($data);
    }

    public function statistiquesDocuments(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        $data = $this->reportingService->getStatistiquesDocuments((int) $annee);
        return response()->json($data);
    }
}
