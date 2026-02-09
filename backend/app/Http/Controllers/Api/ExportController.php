<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExportService;
use App\Services\ReportingService;
use App\Models\Facture;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Client;
use App\Models\Paiement;
use App\Models\MouvementCaisse;
use App\Models\Annulation;
use App\Models\CreditBancaire;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class ExportController extends Controller
{
    protected ExportService $exportService;
    protected ReportingService $reportingService;

    public function __construct(ExportService $exportService, ReportingService $reportingService)
    {
        $this->exportService = $exportService;
        $this->reportingService = $reportingService;
    }

    // ==================== CSV EXPORTS (existing) ====================

    public function factures(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut', 'client_id']);
        $csv = $this->exportService->exportFacturesCSV($filters);
        return $this->streamCSV($csv, 'factures');
    }

    public function devis(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut']);
        $csv = $this->exportService->exportDevisCSV($filters);
        return $this->streamCSV($csv, 'devis');
    }

    public function ordres(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut', 'client_id', 'categorie']);
        $csv = $this->exportService->exportOrdresCSV($filters);
        return $this->streamCSV($csv, 'ordres-travail');
    }

    public function primes(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut', 'representant_id']);
        $csv = $this->exportService->exportPrimesCSV($filters);
        return $this->streamCSV($csv, 'primes');
    }

    public function activiteGlobale(Request $request): StreamedResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfYear()->toDateString());
        $dateFin = $request->get('date_fin', now()->endOfYear()->toDateString());
        $csv = $this->exportService->exportActiviteGlobaleCSV($dateDebut, $dateFin);
        return $this->streamCSV($csv, 'activite-globale');
    }

    public function paiements(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'mode_paiement']);
        $csv = $this->exportService->exportPaiementsCSV($filters);
        return $this->streamCSV($csv, 'paiements');
    }

    public function caisse(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'type', 'categorie']);
        $csv = $this->exportService->exportCaisseCSV($filters);
        return $this->streamCSV($csv, 'caisse');
    }

    public function caisseEspeces(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'type']);
        $filters['source'] = 'caisse';
        $csv = $this->exportService->exportCaisseEspecesCSV($filters);
        return $this->streamCSV($csv, 'caisse-especes');
    }

    public function clients(Request $request): StreamedResponse
    {
        $filters = $request->only(['type', 'actif']);
        $csv = $this->exportService->exportClientsCSV($filters);
        return $this->streamCSV($csv, 'clients');
    }

    public function chiffreAffaires(Request $request): StreamedResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $csv = $this->exportService->exportChiffreAffairesCSV($annee);
        return $this->streamCSV($csv, "chiffre-affaires-{$annee}");
    }

    public function creances(Request $request): StreamedResponse
    {
        $csv = $this->exportService->exportCreancesCSV();
        return $this->streamCSV($csv, 'creances');
    }

    public function tresorerie(Request $request): StreamedResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth()->toDateString());
        $dateFin = $request->get('date_fin', now()->endOfMonth()->toDateString());
        $csv = $this->exportService->exportTresorerieCSV($dateDebut, $dateFin);
        return $this->streamCSV($csv, 'tresorerie');
    }

    public function credits(Request $request): StreamedResponse
    {
        $filters = $request->only(['statut', 'banque_id']);
        $csv = $this->exportService->exportCreditsCSV($filters);
        return $this->streamCSV($csv, 'credits');
    }

    public function annulations(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'type']);
        $csv = $this->exportService->exportAnnulationsCSV($filters);
        return $this->streamCSV($csv, 'annulations');
    }

    public function tableauDeBord(Request $request): StreamedResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $csv = $this->exportService->exportTableauDeBordCSV($annee);
        return $this->streamCSV($csv, "tableau-de-bord-{$annee}");
    }

    public function caisseGlobale(Request $request)
    {
        $filters = [
            'date_debut' => $request->get('date_debut', now()->startOfMonth()->toDateString()),
            'date_fin' => $request->get('date_fin', now()->toDateString()),
            'type' => $request->get('type', 'all'),
            'source' => $request->get('source', 'all'),
            'banque_id' => $request->get('banque_id'),
            'include_details' => $request->get('include_details', '1') === '1',
            'include_summary' => $request->get('include_summary', '1') === '1',
        ];
        
        $format = $request->get('format', 'pdf');
        
        if ($format === 'pdf') {
            return $this->exportService->exportCaisseGlobalePDF($filters);
        }
        
        $csv = $this->exportService->exportCaisseGlobaleCSV($filters);
        return $this->streamCSV($csv, 'caisse-globale');
    }

    // ==================== PDF EXPORTS (per type) ====================

    /**
     * Export PDF des factures
     */
    public function facturesPdf(Request $request)
    {
        try {
            $filters = $request->only(['date_debut', 'date_fin', 'statut', 'client_id']);
            $query = Facture::with(['client', 'paiements']);

            if (!empty($filters['date_debut'])) $query->where('date_creation', '>=', $filters['date_debut']);
            if (!empty($filters['date_fin'])) $query->where('date_creation', '<=', $filters['date_fin']);
            if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);
            if (!empty($filters['client_id'])) $query->where('client_id', $filters['client_id']);

            $factures = $query->orderBy('date_creation', 'desc')->get();

            $clientNom = null;
            if (!empty($filters['client_id'])) {
                $client = Client::find($filters['client_id']);
                $clientNom = $client ? ($client->raison_sociale ?? $client->nom_complet) : null;
            }

            $stats = [
                'total' => $factures->count(),
                'montant_ttc' => $factures->sum('montant_ttc'),
                'montant_paye' => $factures->sum('montant_paye'),
                'reste_a_payer' => $factures->sum('montant_ttc') - $factures->sum('montant_paye'),
            ];

            $pdf = Pdf::loadView('pdf.export-factures', [
                'factures' => $factures,
                'stats' => $stats,
                'date_debut' => $filters['date_debut'] ?? '-',
                'date_fin' => $filters['date_fin'] ?? '-',
                'periode' => ($filters['date_debut'] ?? '') . ' — ' . ($filters['date_fin'] ?? ''),
                'client_nom' => $clientNom,
                'statut_label' => !empty($filters['statut']) ? ucfirst(str_replace('_', ' ', $filters['statut'])) : null,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('factures-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF factures: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF factures: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF des ordres de travail
     */
    public function ordresPdf(Request $request)
    {
        try {
            $filters = $request->only(['date_debut', 'date_fin', 'statut', 'client_id', 'categorie']);
            $query = OrdreTravail::with(['client', 'transitaire', 'representant', 'armateur']);

            if (!empty($filters['date_debut'])) $query->where('date_creation', '>=', $filters['date_debut']);
            if (!empty($filters['date_fin'])) $query->where('date_creation', '<=', $filters['date_fin']);
            if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);
            if (!empty($filters['client_id'])) $query->where('client_id', $filters['client_id']);
            if (!empty($filters['categorie'])) $query->where('categorie', $filters['categorie']);

            $ordres = $query->orderBy('date_creation', 'desc')->get();

            $clientNom = null;
            if (!empty($filters['client_id'])) {
                $client = Client::find($filters['client_id']);
                $clientNom = $client ? ($client->raison_sociale ?? $client->nom_complet) : null;
            }

            $stats = [
                'total' => $ordres->count(),
                'montant_ttc' => $ordres->sum('montant_ttc'),
                'en_cours' => $ordres->where('statut', 'en_cours')->count(),
                'termines' => $ordres->where('statut', 'termine')->count(),
            ];

            $pdf = Pdf::loadView('pdf.export-ordres', [
                'ordres' => $ordres,
                'stats' => $stats,
                'date_debut' => $filters['date_debut'] ?? '-',
                'date_fin' => $filters['date_fin'] ?? '-',
                'periode' => ($filters['date_debut'] ?? '') . ' — ' . ($filters['date_fin'] ?? ''),
                'client_nom' => $clientNom,
                'statut_label' => !empty($filters['statut']) ? ucfirst(str_replace('_', ' ', $filters['statut'])) : null,
                'categorie_label' => !empty($filters['categorie']) ? ucfirst($filters['categorie']) : null,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('ordres-travail-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF ordres: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF ordres: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF des devis
     */
    public function devisPdf(Request $request)
    {
        try {
            $filters = $request->only(['date_debut', 'date_fin', 'statut']);
            $query = Devis::with(['client']);

            if (!empty($filters['date_debut'])) $query->where('date_creation', '>=', $filters['date_debut']);
            if (!empty($filters['date_fin'])) $query->where('date_creation', '<=', $filters['date_fin']);
            if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);

            $devis = $query->orderBy('date_creation', 'desc')->get();

            $stats = [
                'total' => $devis->count(),
                'montant_ttc' => $devis->sum('montant_ttc'),
                'acceptes' => $devis->where('statut', 'accepte')->count(),
                'taux_conversion' => $devis->count() > 0 ? round(($devis->where('statut', 'accepte')->count() / $devis->count()) * 100, 1) : 0,
            ];

            $pdf = Pdf::loadView('pdf.export-devis', [
                'devis' => $devis,
                'stats' => $stats,
                'date_debut' => $filters['date_debut'] ?? '-',
                'date_fin' => $filters['date_fin'] ?? '-',
                'periode' => ($filters['date_debut'] ?? '') . ' — ' . ($filters['date_fin'] ?? ''),
                'statut_label' => !empty($filters['statut']) ? ucfirst(str_replace('_', ' ', $filters['statut'])) : null,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('devis-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF devis: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF devis: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF des paiements
     */
    public function paiementsPdf(Request $request)
    {
        try {
            $filters = $request->only(['date_debut', 'date_fin', 'mode_paiement', 'document_type']);
            $query = Paiement::with(['facture.client', 'ordre.client', 'client', 'noteDebut']);

            if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
            if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
            if (!empty($filters['mode_paiement'])) $query->where('mode_paiement', $filters['mode_paiement']);

            // Filtre par type de document
            if (!empty($filters['document_type'])) {
                if ($filters['document_type'] === 'facture') {
                    $query->whereNotNull('facture_id');
                } elseif ($filters['document_type'] === 'ordre') {
                    $query->whereNotNull('ordre_id')->whereNull('facture_id');
                }
            }

            $paiements = $query->orderBy('date', 'desc')->get();

            $stats = [
                'total' => $paiements->count(),
                'montant_total' => $paiements->sum('montant'),
                'especes' => $paiements->where('mode_paiement', 'especes')->sum('montant'),
                'autres' => $paiements->where('mode_paiement', '!=', 'especes')->sum('montant'),
            ];

            $pdf = Pdf::loadView('pdf.export-paiements', [
                'paiements' => $paiements,
                'stats' => $stats,
                'date_debut' => $filters['date_debut'] ?? '-',
                'date_fin' => $filters['date_fin'] ?? '-',
                'periode' => ($filters['date_debut'] ?? '') . ' — ' . ($filters['date_fin'] ?? ''),
                'mode_label' => !empty($filters['mode_paiement']) ? ucfirst($filters['mode_paiement']) : null,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('paiements-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF paiements: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF paiements: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF des clients
     */
    public function clientsPdf(Request $request)
    {
        try {
            $query = Client::withCount(['factures', 'devis']);
            $clients = $query->orderBy('created_at', 'desc')->get();

            $stats = [
                'total' => $clients->count(),
                'actifs' => $clients->where('actif', true)->count(),
                'entreprises' => $clients->where('type', 'entreprise')->count(),
                'particuliers' => $clients->where('type', '!=', 'entreprise')->count(),
            ];

            $pdf = Pdf::loadView('pdf.export-clients', [
                'clients' => $clients,
                'stats' => $stats,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('clients-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF clients: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF clients: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF des primes
     */
    public function primesPdf(Request $request)
    {
        try {
            $filters = $request->only(['date_debut', 'date_fin', 'statut']);
            $query = \App\Models\Prime::with(['representant', 'paiements']);

            if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
            if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
            if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);

            $primes = $query->orderBy('date', 'desc')->get();

            $totalPaye = $primes->sum(fn($p) => $p->paiements->sum('montant'));
            $stats = [
                'total' => $primes->count(),
                'montant_total' => $primes->sum('montant'),
                'montant_paye' => $totalPaye,
                'reste_a_payer' => $primes->sum('montant') - $totalPaye,
            ];

            $pdf = Pdf::loadView('pdf.export-primes', [
                'primes' => $primes,
                'stats' => $stats,
                'date_debut' => $filters['date_debut'] ?? '-',
                'date_fin' => $filters['date_fin'] ?? '-',
                'periode' => ($filters['date_debut'] ?? '') . ' — ' . ($filters['date_fin'] ?? ''),
                'statut_label' => !empty($filters['statut']) ? ucfirst(str_replace('_', ' ', $filters['statut'])) : null,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('primes-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF primes: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF primes: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF des mouvements caisse
     */
    public function caissePdf(Request $request)
    {
        try {
            $filters = $request->only(['date_debut', 'date_fin', 'type', 'categorie']);
            $query = MouvementCaisse::query();

            if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
            if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
            if (!empty($filters['type'])) $query->where('type', $filters['type']);
            if (!empty($filters['categorie'])) $query->where('categorie', $filters['categorie']);

            $mouvements = $query->orderBy('date', 'asc')->get();

            $stats = [
                'total' => $mouvements->count(),
                'total_entrees' => $mouvements->where('type', 'entree')->sum('montant'),
                'total_sorties' => $mouvements->where('type', 'sortie')->sum('montant'),
            ];

            $pdf = Pdf::loadView('pdf.export-caisse', [
                'mouvements' => $mouvements,
                'stats' => $stats,
                'date_debut' => $filters['date_debut'] ?? '-',
                'date_fin' => $filters['date_fin'] ?? '-',
                'periode' => ($filters['date_debut'] ?? '') . ' — ' . ($filters['date_fin'] ?? ''),
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('caisse-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF caisse: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF caisse: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF des créances
     */
    public function creancesPdf(Request $request)
    {
        try {
            $data = $this->reportingService->getCreances();
            
            $topDebiteurs = collect($data['top_debiteurs'] ?? $data['par_client'] ?? []);
            $tranches = $data['par_tranche_age'] ?? $data['par_tranche'] ?? [];
            
            // Normaliser les tranches en array
            if (!is_array($tranches) || !isset($tranches[0])) {
                $tranchesArray = [];
                if (is_array($tranches) || is_object($tranches)) {
                    foreach ($tranches as $key => $value) {
                        $tranchesArray[] = ['tranche' => str_replace('_', ' ', $key), 'montant' => $value];
                    }
                }
                $tranches = $tranchesArray;
            }

            $stats = [
                'total_creances' => $data['total_creances'] ?? 0,
                'nb_factures' => $data['nb_factures_impayees'] ?? $data['nombre_factures'] ?? 0,
                'age_moyen' => $data['age_moyen'] ?? 0,
                'nb_clients' => $topDebiteurs->count(),
            ];

            $pdf = Pdf::loadView('pdf.export-creances', [
                'debiteurs' => $topDebiteurs->toArray(),
                'tranches' => $tranches,
                'stats' => $stats,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('creances-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF créances: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF créances: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF des annulations
     */
    public function annulationsPdf(Request $request)
    {
        try {
            $filters = $request->only(['date_debut', 'date_fin', 'type']);
            $query = Annulation::with(['client']);

            if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
            if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
            if (!empty($filters['type'])) $query->where('type', $filters['type']);

            $annulations = $query->orderBy('date', 'desc')->get();

            $stats = [
                'total' => $annulations->count(),
                'montant_total' => $annulations->sum('montant'),
                'factures' => $annulations->where('type', 'facture')->count(),
                'autres' => $annulations->where('type', '!=', 'facture')->count(),
            ];

            $pdf = Pdf::loadView('pdf.export-annulations', [
                'annulations' => $annulations,
                'stats' => $stats,
                'date_debut' => $filters['date_debut'] ?? '-',
                'date_fin' => $filters['date_fin'] ?? '-',
                'periode' => ($filters['date_debut'] ?? '') . ' — ' . ($filters['date_fin'] ?? ''),
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('annulations-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF annulations: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF annulations: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF des crédits bancaires
     */
    public function creditsPdf(Request $request)
    {
        try {
            $filters = $request->only(['statut', 'banque_id']);
            $query = CreditBancaire::with(['banque', 'remboursements']);

            if (!empty($filters['statut'])) $query->where('statut', $filters['statut']);
            if (!empty($filters['banque_id'])) $query->where('banque_id', $filters['banque_id']);

            $credits = $query->orderBy('date_obtention', 'desc')->get();

            $totalRembourse = $credits->sum(fn($c) => $c->remboursements->sum('montant'));
            $stats = [
                'total' => $credits->count(),
                'montant_emprunte' => $credits->sum('montant'),
                'montant_rembourse' => $totalRembourse,
                'reste' => $credits->sum('montant') - $totalRembourse,
            ];

            $pdf = Pdf::loadView('pdf.export-credits', [
                'credits' => $credits,
                'stats' => $stats,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('credits-bancaires-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF crédits: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF crédits: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    /**
     * Export PDF de l'activité clients
     */
    public function activiteGlobalePdf(Request $request)
    {
        try {
            $dateDebut = $request->get('date_debut', now()->startOfYear()->toDateString());
            $dateFin = $request->get('date_fin', now()->endOfYear()->toDateString());
            $data = $this->reportingService->getActiviteClients($dateDebut, $dateFin, 100);

            $clients = collect($data['top_clients'] ?? []);

            $stats = [
                'nb_clients' => $clients->count(),
                'ca_total' => $clients->sum(fn($c) => $c->factures_sum_montant_ttc ?? 0),
                'paiements' => $clients->sum(fn($c) => $c->paiements_sum_montant ?? 0),
                'solde' => $clients->sum(fn($c) => $c->solde ?? 0),
            ];

            $pdf = Pdf::loadView('pdf.export-activite-clients', [
                'clients' => $clients,
                'stats' => $stats,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'periode' => $dateDebut . ' — ' . $dateFin,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('activite-clients-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF activité clients: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF activité clients: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    // ==================== ROLES EXPORT (existing) ====================

    public function roles(Request $request)
    {
        $format = $request->get('format', 'pdf');
        $search = $request->get('search');
        $hasUsers = $request->has('has_users') ? filter_var($request->get('has_users'), FILTER_VALIDATE_BOOLEAN) : null;
        $isSystem = $request->has('is_system') ? filter_var($request->get('is_system'), FILTER_VALIDATE_BOOLEAN) : null;

        $rolesQuery = Role::with('permissions');
        if ($search) {
            $rolesQuery->where('name', 'like', "%{$search}%");
        }

        $roles = $rolesQuery->get()->map(function ($role) {
            $usersCount = User::role($role->name)->count();
            $users = User::role($role->name)->select('id', 'name', 'email', 'actif')->get();
            
            return [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $this->getRoleDescription($role->name),
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'permissions_count' => $role->permissions->count(),
                'users_count' => $usersCount,
                'users' => $users,
                'is_system' => in_array($role->name, ['administrateur', 'directeur']),
                'created_at' => $role->created_at,
            ];
        });

        if ($hasUsers !== null) {
            $roles = $roles->filter(fn($r) => $hasUsers ? $r['users_count'] > 0 : $r['users_count'] === 0);
        }
        if ($isSystem !== null) {
            $roles = $roles->filter(fn($r) => $r['is_system'] === $isSystem);
        }
        $roles = $roles->values();

        $permissionsByModule = Permission::all()
            ->groupBy(fn($permission) => explode('.', $permission->name)[0] ?? 'autre')
            ->map(function ($permissions, $module) {
                return [
                    'module' => $module,
                    'label' => $this->getModuleLabel($module),
                    'permissions' => $permissions->map(function ($p) {
                        $parts = explode('.', $p->name);
                        return ['name' => $p->name, 'action' => $parts[1] ?? $p->name, 'label' => $this->getPermissionLabel($parts[1] ?? $p->name)];
                    })->values()->toArray(),
                ];
            })->values();

        $stats = [
            'total_roles' => $roles->count(),
            'total_permissions' => Permission::count(),
            'total_users' => User::count(),
            'system_roles' => $roles->filter(fn($r) => $r['is_system'])->count(),
            'custom_roles' => $roles->filter(fn($r) => !$r['is_system'])->count(),
        ];

        $data = [
            'roles' => $roles,
            'permissions_by_module' => $permissionsByModule,
            'stats' => $stats,
            'generated_at' => now()->format('d/m/Y H:i'),
            'generated_by' => auth()->user()->name ?? 'Système',
        ];

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('pdf.roles-permissions', $data);
            $pdf->setPaper('A4', 'landscape');
            return $pdf->download('roles-permissions-' . now()->format('Y-m-d') . '.pdf');
        }

        return $this->streamCSV($this->generateRolesCSV($roles, $permissionsByModule, $stats), 'roles-permissions');
    }

    protected function generateRolesCSV($roles, $permissionsByModule, $stats): string
    {
        $lines = [];
        $lines[] = "RAPPORT DES RÔLES ET PERMISSIONS";
        $lines[] = "Généré le: " . now()->format('d/m/Y H:i');
        $lines[] = "";
        $lines[] = "=== STATISTIQUES ===";
        $lines[] = "Total rôles;" . $stats['total_roles'];
        $lines[] = "Total permissions;" . $stats['total_permissions'];
        $lines[] = "Total utilisateurs;" . $stats['total_users'];
        $lines[] = "Rôles système;" . $stats['system_roles'];
        $lines[] = "Rôles personnalisés;" . $stats['custom_roles'];
        $lines[] = "";
        $lines[] = "=== LISTE DES RÔLES ===";
        $lines[] = "Nom;Description;Type;Permissions;Utilisateurs;Date création";
        
        foreach ($roles as $role) {
            $lines[] = implode(';', [
                ucfirst($role['name']), $role['description'],
                $role['is_system'] ? 'Système' : 'Personnalisé',
                $role['permissions_count'], $role['users_count'],
                $role['created_at'] ? date('d/m/Y', strtotime($role['created_at'])) : '-',
            ]);
        }
        $lines[] = "";
        $lines[] = "=== DÉTAIL DES PERMISSIONS PAR RÔLE ===";
        
        foreach ($roles as $role) {
            $lines[] = "";
            $lines[] = "--- " . strtoupper($role['name']) . " ---";
            $lines[] = "Description: " . $role['description'];
            $lines[] = "Nombre de permissions: " . $role['permissions_count'];
            $lines[] = "Nombre d'utilisateurs: " . $role['users_count'];
            $lines[] = "";
            
            $rolePermissions = collect($role['permissions']);
            foreach ($permissionsByModule as $module) {
                $modulePerms = $rolePermissions->filter(fn($p) => str_starts_with($p, $module['module'] . '.'));
                if ($modulePerms->count() > 0) {
                    $lines[] = $module['label'] . ": " . $modulePerms->map(fn($p) => explode('.', $p)[1] ?? $p)->implode(', ');
                }
            }
            
            if (count($role['users']) > 0) {
                $lines[] = "";
                $lines[] = "Utilisateurs:";
                foreach ($role['users'] as $user) {
                    $status = $user['actif'] ? 'Actif' : 'Inactif';
                    $lines[] = "  - " . $user['name'] . " (" . $user['email'] . ") - " . $status;
                }
            }
        }
        $lines[] = "";
        $lines[] = "=== PERMISSIONS PAR MODULE ===";
        foreach ($permissionsByModule as $module) {
            $lines[] = "";
            $lines[] = $module['label'] . " (" . count($module['permissions']) . " permissions):";
            foreach ($module['permissions'] as $perm) {
                $lines[] = "  - " . $perm['label'] . " (" . $perm['name'] . ")";
            }
        }
        
        return implode("\n", $lines);
    }

    protected function getRoleDescription(string $name): string
    {
        $descriptions = [
            'administrateur' => 'Accès complet à toutes les fonctionnalités du système',
            'directeur' => 'Accès complet avec droits de supervision',
            'comptable' => 'Gestion des factures, paiements et finances',
            'caissier' => 'Gestion de la caisse et des encaissements',
            'commercial' => 'Gestion des clients, devis et prospection',
            'operateur' => 'Suivi des ordres de travail et opérations',
        ];
        return $descriptions[$name] ?? 'Rôle personnalisé';
    }

    protected function getModuleLabel(string $module): string
    {
        $labels = [
            'clients' => 'Clients', 'devis' => 'Devis', 'ordres' => 'Ordres de Travail',
            'factures' => 'Factures', 'paiements' => 'Paiements', 'caisse' => 'Caisse',
            'banques' => 'Banques', 'credits' => 'Crédits Bancaires', 'partenaires' => 'Partenaires',
            'notes' => 'Notes de Débit', 'utilisateurs' => 'Utilisateurs',
            'configuration' => 'Configuration', 'reporting' => 'Reporting', 'audit' => 'Traçabilité',
        ];
        return $labels[$module] ?? ucfirst($module);
    }

    protected function getPermissionLabel(string $action): string
    {
        $labels = ['voir' => 'Voir', 'creer' => 'Créer', 'modifier' => 'Modifier', 'supprimer' => 'Supprimer'];
        return $labels[$action] ?? ucfirst($action);
    }

    protected function streamCSV(string $content, string $filename): StreamedResponse
    {
        $date = now()->format('Y-m-d');
        return new StreamedResponse(function () use ($content) {
            echo "\xEF\xBB\xBF";
            echo $content;
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}_{$date}.csv\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
