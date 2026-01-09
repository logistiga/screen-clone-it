<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Facture;
use App\Models\Paiement;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $dateDebut = $request->get('date_debut', now()->startOfMonth());
            $dateFin = $request->get('date_fin', now()->endOfMonth());

            $stats = [
                // Compteurs généraux
                'clients' => [
                    'total' => Client::count(),
                    'nouveaux' => Client::whereBetween('created_at', [$dateDebut, $dateFin])->count(),
                ],
                
                // Devis
                'devis' => [
                    'total' => Devis::count(),
                    'periode' => Devis::whereBetween('date_creation', [$dateDebut, $dateFin])->count(),
                    'montant_total' => Devis::whereBetween('date_creation', [$dateDebut, $dateFin])->sum('montant_ttc'),
                    'par_statut' => Devis::selectRaw('statut, COUNT(*) as total, SUM(montant_ttc) as montant')
                        ->groupBy('statut')
                        ->get(),
                ],

                // Ordres de travail
                'ordres' => [
                    'total' => OrdreTravail::count(),
                    'periode' => OrdreTravail::whereBetween('date_creation', [$dateDebut, $dateFin])->count(),
                    'montant_total' => OrdreTravail::whereBetween('date_creation', [$dateDebut, $dateFin])->sum('montant_ttc'),
                    'par_statut' => OrdreTravail::selectRaw('statut, COUNT(*) as total')
                        ->groupBy('statut')
                        ->get(),
                ],

                // Factures
                'factures' => [
                    'total' => Facture::count(),
                    'periode' => Facture::whereBetween('date_creation', [$dateDebut, $dateFin])->count(),
                    'montant_total' => Facture::whereBetween('date_creation', [$dateDebut, $dateFin])->sum('montant_ttc'),
                    'par_statut' => Facture::selectRaw('statut, COUNT(*) as total, SUM(montant_ttc) as montant')
                        ->groupBy('statut')
                        ->get(),
                ],

                // Paiements
                'paiements' => [
                    'total_periode' => Paiement::whereBetween('date', [$dateDebut, $dateFin])->sum('montant'),
                    'par_mode' => Paiement::whereBetween('date', [$dateDebut, $dateFin])
                        ->selectRaw('mode_paiement, SUM(montant) as total, COUNT(*) as nombre')
                        ->groupBy('mode_paiement')
                        ->get(),
                ],

                // Caisse
                'caisse' => [
                    'solde_actuel' => MouvementCaisse::where('type', 'entree')->sum('montant') 
                        - MouvementCaisse::where('type', 'sortie')->sum('montant'),
                    'entrees_periode' => MouvementCaisse::where('type', 'entree')
                        ->whereBetween('date', [$dateDebut, $dateFin])
                        ->sum('montant'),
                    'sorties_periode' => MouvementCaisse::where('type', 'sortie')
                        ->whereBetween('date', [$dateDebut, $dateFin])
                        ->sum('montant'),
                ],

                // Créances
                'creances' => [
                    'total_impaye' => Facture::whereNotIn('statut', ['payee', 'annulee'])
                        ->selectRaw('SUM(montant_ttc - montant_paye) as total')
                        ->value('total') ?? 0,
                    'factures_en_retard' => Facture::whereNotIn('statut', ['payee', 'annulee'])
                        ->where('date_echeance', '<', now())
                        ->count(),
                ],
            ];

            return response()->json($stats);

        } catch (\Throwable $e) {
            Log::error('Erreur Dashboard index', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du chargement du dashboard',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function graphiques(Request $request): JsonResponse
    {
        try {
            $annee = $request->get('annee', date('Y'));

            $graphiques = [
                // Chiffre d'affaires par mois
                'ca_mensuel' => Facture::whereYear('date_creation', $annee)
                    ->whereNotIn('statut', ['annulee'])
                    ->selectRaw('MONTH(date_creation) as mois, SUM(montant_ttc) as total')
                    ->groupBy('mois')
                    ->orderBy('mois')
                    ->get(),

                // Paiements par mois
                'paiements_mensuel' => Paiement::whereYear('date', $annee)
                    ->selectRaw('MONTH(date) as mois, SUM(montant) as total')
                    ->groupBy('mois')
                    ->orderBy('mois')
                    ->get(),

                // Top clients
                'top_clients' => Client::withSum(['factures' => fn($q) => $q->whereYear('date_creation', $annee)->whereNotIn('statut', ['annulee'])], 'montant_ttc')
                    ->orderByDesc('factures_sum_montant_ttc')
                    ->limit(10)
                    ->get(['id', 'nom', 'factures_sum_montant_ttc']),

                // Répartition par catégorie
                'repartition_types' => Facture::whereYear('date_creation', $annee)
                    ->whereNotIn('statut', ['annulee'])
                    ->selectRaw('categorie, COUNT(*) as nombre, SUM(montant_ttc) as montant')
                    ->groupBy('categorie')
                    ->get(),
            ];

            return response()->json($graphiques);

        } catch (\Throwable $e) {
            Log::error('Erreur Dashboard graphiques', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du chargement des graphiques',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function alertes(): JsonResponse
    {
        try {
            $alertes = [
                // Factures en retard
                'factures_retard' => Facture::with('client')
                    ->whereNotIn('statut', ['payee', 'annulee'])
                    ->where('date_echeance', '<', now())
                    ->orderBy('date_echeance')
                    ->limit(10)
                    ->get(),

                // Devis expirants (validité proche)
                'devis_expirants' => Devis::with('client')
                    ->whereIn('statut', ['brouillon', 'envoye'])
                    ->where('date_validite', '<=', now()->addDays(7))
                    ->where('date_validite', '>=', now())
                    ->limit(10)
                    ->get(),

                // Ordres en attente depuis longtemps
                'ordres_attente' => OrdreTravail::with('client')
                    ->where('statut', 'en_cours')
                    ->where('created_at', '<', now()->subDays(7))
                    ->limit(10)
                    ->get(),
            ];

            return response()->json($alertes);

        } catch (\Throwable $e) {
            Log::error('Erreur Dashboard alertes', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du chargement des alertes',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function activiteRecente(): JsonResponse
    {
        try {
            $activites = collect();

            // Dernières factures
            $factures = Facture::with('client')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(fn($f) => [
                    'type' => 'facture',
                    'id' => $f->id,
                    'numero' => $f->numero,
                    'client' => $f->client?->nom ?? 'Client inconnu',
                    'montant' => $f->montant_ttc,
                    'date' => $f->created_at,
                ]);

            // Derniers paiements
            $paiements = Paiement::with(['facture', 'client'])
                ->orderBy('date', 'desc')
                ->limit(5)
                ->get()
                ->map(fn($p) => [
                    'type' => 'paiement',
                    'id' => $p->id,
                    'facture' => $p->facture?->numero ?? 'N/A',
                    'client' => $p->client?->nom ?? 'Client inconnu',
                    'montant' => $p->montant,
                    'date' => $p->date,
                ]);

            // Derniers clients
            $clients = Client::orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(fn($c) => [
                    'type' => 'client',
                    'id' => $c->id,
                    'nom' => $c->nom,
                    'date' => $c->created_at,
                ]);

            // Fusionner et trier par date
            $activites = collect()
                ->merge($factures)
                ->merge($paiements)
                ->merge($clients)
                ->sortByDesc('date')
                ->take(15)
                ->values();

            return response()->json($activites);

        } catch (\Throwable $e) {
            Log::error('Erreur Dashboard activiteRecente', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du chargement de l\'activité',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
