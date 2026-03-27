<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

/**
 * Exports PDF uniquement
 */
class ExportPdfController extends Controller
{
    protected ReportingService $reportingService;

    public function __construct(ReportingService $reportingService)
    {
        $this->reportingService = $reportingService;
    }

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

    public function paiementsPdf(Request $request)
    {
        try {
            $filters = $request->only(['date_debut', 'date_fin', 'mode_paiement', 'document_type']);
            $query = Paiement::with(['facture.client', 'ordre.client', 'client', 'noteDebut']);

            if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
            if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
            if (!empty($filters['mode_paiement'])) $query->where('mode_paiement', $filters['mode_paiement']);

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
                'document_type_label' => !empty($filters['document_type']) ? ($filters['document_type'] === 'facture' ? 'Factures' : 'Ordres de Travail') : null,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('paiements-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF paiements: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF paiements: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

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

            $soldeActuelCaisse = MouvementCaisse::where('source', 'caisse')->where('type', 'entree')->sum('montant')
                - MouvementCaisse::where('source', 'caisse')->where('type', 'sortie')->sum('montant');

            $pdf = Pdf::loadView('pdf.export-caisse', [
                'mouvements' => $mouvements,
                'stats' => $stats,
                'date_debut' => $filters['date_debut'] ?? '-',
                'date_fin' => $filters['date_fin'] ?? '-',
                'periode' => ($filters['date_debut'] ?? '') . ' — ' . ($filters['date_fin'] ?? ''),
                'solde_actuel_caisse' => $soldeActuelCaisse,
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download('caisse-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Throwable $e) {
            Log::error('Export PDF caisse: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Erreur export PDF caisse: ' . $e->getMessage(), 'error' => 'export_error'], 422);
        }
    }

    public function creancesPdf(Request $request)
    {
        try {
            $data = $this->reportingService->getCreances();
            
            $topDebiteurs = collect($data['top_debiteurs'] ?? $data['par_client'] ?? []);
            $tranches = $data['par_tranche_age'] ?? $data['par_tranche'] ?? [];
            
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
}
