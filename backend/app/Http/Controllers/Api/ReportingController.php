<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportingController extends Controller
{
    protected ReportingService $reportingService;

    public function __construct(ReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
    }

    /**
     * Export PDF du rapport d'activité annuel
     */
    public function exportPdf(Request $request)
    {
        try {
            $annee = (int) $request->get('annee', date('Y'));

            // Récupérer les données du tableau de bord (KPIs) — résilient
            $kpis = [];
            try {
                $dashboard = $this->reportingService->getTableauDeBord($annee);
                $kpis = $dashboard['kpis'] ?? [];
            } catch (\Throwable $e) {
                Log::warning('PDF Reporting: tableau de bord indisponible - ' . $e->getMessage());
            }

            // Rentabilité
            $rentabilite = [];
            try {
                $rentabilite = $this->reportingService->getRentabilite($annee);
            } catch (\Throwable $e) {
                Log::warning('PDF Reporting: rentabilité indisponible - ' . $e->getMessage());
            }

            // Évolution mensuelle du CA
            $evolution = [];
            try {
                $caData = $this->reportingService->getChiffreAffaires($annee);
                $evolution = $caData['par_mois'] ?? $caData['mensuel'] ?? [];
                // Convertir en array si c'est une Collection
                if ($evolution instanceof \Illuminate\Support\Collection) {
                    $evolution = $evolution->map(fn($m) => [
                        'mois' => $m->mois ?? $m['mois'] ?? 0,
                        'total_ttc' => $m->total_ttc ?? $m['total_ttc'] ?? 0,
                        'nb_factures' => $m->nombre_factures ?? $m['nombre_factures'] ?? 0,
                    ])->toArray();
                }
            } catch (\Throwable $e) {
                Log::warning('PDF Reporting: évolution CA indisponible - ' . $e->getMessage());
            }

            // Top clients
            $topClients = [];
            try {
                $clientsData = $this->reportingService->getActiviteClients(
                    "{$annee}-01-01",
                    "{$annee}-12-31",
                    10
                );
                $topClients = collect($clientsData['top_clients'] ?? [])->map(fn($c) => [
                    'client_nom' => $c['nom'] ?? $c['raison_sociale'] ?? $c['client_nom'] ?? 'Inconnu',
                    'ca_total' => $c['factures_sum_montant_ttc'] ?? $c['ca_total'] ?? 0,
                    'nb_factures' => $c['factures_count'] ?? $c['nb_factures'] ?? 0,
                    'paiements' => $c['paiements_sum_montant'] ?? $c['paiements'] ?? 0,
                    'solde_du' => $c['solde'] ?? $c['solde_du'] ?? 0,
                ])->toArray();
            } catch (\Throwable $e) {
                Log::warning('PDF Reporting: top clients indisponible - ' . $e->getMessage());
            }

            // Créances
            $creances = [];
            try {
                $creances = $this->reportingService->getCreances();
            } catch (\Throwable $e) {
                Log::warning('PDF Reporting: créances indisponible - ' . $e->getMessage());
            }

            $data = compact('annee', 'kpis', 'rentabilite', 'evolution', 'topClients', 'creances');

            $pdf = Pdf::loadView('pdf.reporting', $data)
                ->setPaper('a4', 'portrait')
                ->setOptions(['isRemoteEnabled' => true, 'defaultFont' => 'DejaVu Sans']);

            return $pdf->download("Reporting_{$annee}.pdf");

        } catch (\Throwable $e) {
            Log::error('PDF Reporting error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors de la génération du PDF de reporting: ' . $e->getMessage(),
                'error' => 'reporting_error',
            ], 422);
        }
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
