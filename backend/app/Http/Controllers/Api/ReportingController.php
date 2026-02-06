<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ReportingController extends Controller
{
    protected ReportingService $reportingService;

    public function __construct(ReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
    }

    public function dashboard(Request $request): JsonResponse
    {
        try {
            $annee = $request->get('annee', date('Y'));
            $data = $this->reportingService->getTableauDeBord((int) $annee);
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Reporting synthese error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors du calcul du tableau de bord: ' . $e->getMessage(),
                'error' => 'reporting_error',
            ], 422);
        }
    }

    public function chiffreAffaires(Request $request): JsonResponse
    {
        try {
            $annee = $request->get('annee', date('Y'));
            $mois = $request->get('mois');
            $data = $this->reportingService->getChiffreAffaires((int) $annee, $mois ? (int) $mois : null);
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Reporting chiffre-affaires error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors du calcul du chiffre d\'affaires: ' . $e->getMessage(),
                'error' => 'reporting_error',
            ], 422);
        }
    }

    public function rentabilite(Request $request): JsonResponse
    {
        try {
            $annee = $request->get('annee', date('Y'));
            $data = $this->reportingService->getRentabilite((int) $annee);
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Reporting rentabilite error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors du calcul de la rentabilité: ' . $e->getMessage(),
                'error' => 'reporting_error',
            ], 422);
        }
    }

    public function creances(Request $request): JsonResponse
    {
        try {
            $data = $this->reportingService->getCreances();
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Reporting creances error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors du calcul des créances: ' . $e->getMessage(),
                'error' => 'reporting_error',
            ], 422);
        }
    }

    public function tresorerie(Request $request): JsonResponse
    {
        try {
            $dateDebut = $request->get('date_debut', now()->startOfMonth()->toDateString());
            $dateFin = $request->get('date_fin', now()->endOfMonth()->toDateString());
            $data = $this->reportingService->getTresorerie($dateDebut, $dateFin);
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Reporting tresorerie error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors du calcul de la trésorerie: ' . $e->getMessage(),
                'error' => 'reporting_error',
            ], 422);
        }
    }

    public function comparatif(Request $request): JsonResponse
    {
        try {
            $annee1 = $request->get('annee1', date('Y') - 1);
            $annee2 = $request->get('annee2', date('Y'));
            $data = $this->reportingService->getComparatif((int) $annee1, (int) $annee2);
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Reporting comparatif error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors du comparatif: ' . $e->getMessage(),
                'error' => 'reporting_error',
            ], 422);
        }
    }

    public function activiteClients(Request $request): JsonResponse
    {
        try {
            $dateDebut = $request->get('date_debut', now()->startOfYear()->toDateString());
            $dateFin = $request->get('date_fin', now()->endOfYear()->toDateString());
            $limit = $request->get('limit', 20);
            $data = $this->reportingService->getActiviteClients($dateDebut, $dateFin, (int) $limit);
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Reporting top-clients error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors du calcul de l\'activité clients: ' . $e->getMessage(),
                'error' => 'reporting_error',
            ], 422);
        }
    }

    public function statistiquesDocuments(Request $request): JsonResponse
    {
        try {
            $annee = $request->get('annee', date('Y'));
            $data = $this->reportingService->getStatistiquesDocuments((int) $annee);
            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Reporting analyse-operations error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques documents: ' . $e->getMessage(),
                'error' => 'reporting_error',
            ], 422);
        }
    }
}
