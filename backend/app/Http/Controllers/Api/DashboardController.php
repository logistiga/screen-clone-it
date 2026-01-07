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

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
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
                'periode' => Devis::whereBetween('date', [$dateDebut, $dateFin])->count(),
                'montant_total' => Devis::whereBetween('date', [$dateDebut, $dateFin])->sum('montant_ttc'),
                'par_statut' => Devis::selectRaw('statut, COUNT(*) as total, SUM(montant_ttc) as montant')
                    ->groupBy('statut')
                    ->get(),
            ],

            // Ordres de travail
            'ordres' => [
                'total' => OrdreTravail::count(),
                'periode' => OrdreTravail::whereBetween('date', [$dateDebut, $dateFin])->count(),
                'montant_total' => OrdreTravail::whereBetween('date', [$dateDebut, $dateFin])->sum('montant_ttc'),
                'par_statut' => OrdreTravail::selectRaw('statut, COUNT(*) as total')
                    ->groupBy('statut')
                    ->get(),
            ],

            // Factures
            'factures' => [
                'total' => Facture::count(),
                'periode' => Facture::whereBetween('date', [$dateDebut, $dateFin])->count(),
                'montant_total' => Facture::whereBetween('date', [$dateDebut, $dateFin])->sum('montant_ttc'),
                'par_statut' => Facture::selectRaw('statut, COUNT(*) as total, SUM(montant_ttc) as montant')
                    ->groupBy('statut')
                    ->get(),
            ],

            // Paiements
            'paiements' => [
                'total_periode' => Paiement::whereBetween('date_paiement', [$dateDebut, $dateFin])->sum('montant'),
                'par_mode' => Paiement::whereBetween('date_paiement', [$dateDebut, $dateFin])
                    ->selectRaw('mode_paiement, SUM(montant) as total, COUNT(*) as nombre')
                    ->groupBy('mode_paiement')
                    ->get(),
            ],

            // Caisse
            'caisse' => [
                'solde_actuel' => MouvementCaisse::where('type', 'Entrée')->sum('montant') 
                    - MouvementCaisse::where('type', 'Sortie')->sum('montant'),
                'entrees_periode' => MouvementCaisse::where('type', 'Entrée')
                    ->whereBetween('date_mouvement', [$dateDebut, $dateFin])
                    ->sum('montant'),
                'sorties_periode' => MouvementCaisse::where('type', 'Sortie')
                    ->whereBetween('date_mouvement', [$dateDebut, $dateFin])
                    ->sum('montant'),
            ],

            // Créances
            'creances' => [
                'total_impaye' => Facture::whereIn('statut', ['Envoyée', 'Partiellement payée'])->sum('montant_ttc')
                    - Paiement::whereHas('facture', fn($q) => $q->whereIn('statut', ['Envoyée', 'Partiellement payée']))->sum('montant'),
                'factures_en_retard' => Facture::whereIn('statut', ['Envoyée', 'Partiellement payée'])
                    ->where('date_echeance', '<', now())
                    ->count(),
            ],
        ];

        return response()->json($stats);
    }

    public function graphiques(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        $graphiques = [
            // Chiffre d'affaires par mois
            'ca_mensuel' => Facture::whereYear('date', $annee)
                ->whereIn('statut', ['Envoyée', 'Partiellement payée', 'Payée'])
                ->selectRaw('MONTH(date) as mois, SUM(montant_ttc) as total')
                ->groupBy('mois')
                ->orderBy('mois')
                ->get(),

            // Paiements par mois
            'paiements_mensuel' => Paiement::whereYear('date_paiement', $annee)
                ->selectRaw('MONTH(date_paiement) as mois, SUM(montant) as total')
                ->groupBy('mois')
                ->orderBy('mois')
                ->get(),

            // Top clients
            'top_clients' => Client::withSum(['factures' => fn($q) => $q->whereYear('date', $annee)], 'montant_ttc')
                ->orderByDesc('factures_sum_montant_ttc')
                ->limit(10)
                ->get(['id', 'nom', 'factures_sum_montant_ttc']),

            // Répartition par type de document
            'repartition_types' => Facture::whereYear('date', $annee)
                ->selectRaw('type_document, COUNT(*) as nombre, SUM(montant_ttc) as montant')
                ->groupBy('type_document')
                ->get(),
        ];

        return response()->json($graphiques);
    }

    public function alertes(): JsonResponse
    {
        $alertes = [
            // Factures en retard
            'factures_retard' => Facture::with('client')
                ->whereIn('statut', ['Envoyée', 'Partiellement payée'])
                ->where('date_echeance', '<', now())
                ->orderBy('date_echeance')
                ->limit(10)
                ->get(),

            // Devis expirants
            'devis_expirants' => Devis::with('client')
                ->where('statut', 'Envoyé')
                ->whereRaw('DATE_ADD(date, INTERVAL validite_jours DAY) <= ?', [now()->addDays(7)])
                ->limit(10)
                ->get(),

            // Ordres en attente
            'ordres_attente' => OrdreTravail::with('client')
                ->where('statut', 'En attente')
                ->where('created_at', '<', now()->subDays(3))
                ->limit(10)
                ->get(),
        ];

        return response()->json($alertes);
    }

    public function activiteRecente(): JsonResponse
    {
        $activites = [];

        // Dernières factures
        $factures = Facture::with('client')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($f) => [
                'type' => 'facture',
                'id' => $f->id,
                'numero' => $f->numero,
                'client' => $f->client->nom,
                'montant' => $f->montant_ttc,
                'date' => $f->created_at,
            ]);

        // Derniers paiements
        $paiements = Paiement::with(['facture', 'client'])
            ->orderBy('date_paiement', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'type' => 'paiement',
                'id' => $p->id,
                'facture' => $p->facture->numero,
                'client' => $p->client->nom,
                'montant' => $p->montant,
                'date' => $p->date_paiement,
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
    }
}
