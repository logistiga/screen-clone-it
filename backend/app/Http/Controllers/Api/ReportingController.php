<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Facture;
use App\Models\Paiement;
use App\Models\MouvementCaisse;
use App\Models\CreditBancaire;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportingController extends Controller
{
    public function chiffreAffaires(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        $ca = Facture::whereYear('date', $annee)
            ->whereIn('statut', ['Envoyée', 'Partiellement payée', 'Payée'])
            ->selectRaw('
                MONTH(date) as mois,
                SUM(montant_ht) as total_ht,
                SUM(montant_tva) as total_tva,
                SUM(montant_css) as total_css,
                SUM(montant_ttc) as total_ttc,
                COUNT(*) as nombre_factures
            ')
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();

        $totaux = [
            'total_ht' => $ca->sum('total_ht'),
            'total_tva' => $ca->sum('total_tva'),
            'total_css' => $ca->sum('total_css'),
            'total_ttc' => $ca->sum('total_ttc'),
            'nombre_factures' => $ca->sum('nombre_factures'),
        ];

        return response()->json([
            'annee' => $annee,
            'par_mois' => $ca,
            'totaux' => $totaux,
        ]);
    }

    public function creances(Request $request): JsonResponse
    {
        $factures = Facture::with('client')
            ->whereIn('statut', ['Envoyée', 'Partiellement payée'])
            ->get()
            ->map(function ($facture) {
                $paye = $facture->paiements()->sum('montant');
                return [
                    'facture' => $facture,
                    'montant_paye' => $paye,
                    'reste_a_payer' => $facture->montant_ttc - $paye,
                    'jours_retard' => $facture->date_echeance < now() 
                        ? now()->diffInDays($facture->date_echeance) 
                        : 0,
                ];
            });

        $parClient = $factures->groupBy('facture.client_id')->map(function ($group) {
            return [
                'client' => $group->first()['facture']->client,
                'nombre_factures' => $group->count(),
                'total_restant' => $group->sum('reste_a_payer'),
                'factures' => $group,
            ];
        })->values();

        $tranches = [
            '0-30' => $factures->filter(fn($f) => $f['jours_retard'] >= 0 && $f['jours_retard'] <= 30)->sum('reste_a_payer'),
            '31-60' => $factures->filter(fn($f) => $f['jours_retard'] > 30 && $f['jours_retard'] <= 60)->sum('reste_a_payer'),
            '61-90' => $factures->filter(fn($f) => $f['jours_retard'] > 60 && $f['jours_retard'] <= 90)->sum('reste_a_payer'),
            '+90' => $factures->filter(fn($f) => $f['jours_retard'] > 90)->sum('reste_a_payer'),
        ];

        return response()->json([
            'total_creances' => $factures->sum('reste_a_payer'),
            'nombre_factures' => $factures->count(),
            'par_client' => $parClient,
            'par_tranche_age' => $tranches,
        ]);
    }

    public function tresorerie(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth());
        $dateFin = $request->get('date_fin', now()->endOfMonth());

        // Solde initial (avant la période)
        $soldeInitial = MouvementCaisse::where('date_mouvement', '<', $dateDebut)
            ->selectRaw('
                SUM(CASE WHEN type = "Entrée" THEN montant ELSE 0 END) - 
                SUM(CASE WHEN type = "Sortie" THEN montant ELSE 0 END) as solde
            ')
            ->value('solde') ?? 0;

        // Mouvements de la période
        $mouvements = MouvementCaisse::whereBetween('date_mouvement', [$dateDebut, $dateFin])
            ->selectRaw('
                DATE(date_mouvement) as date,
                SUM(CASE WHEN type = "Entrée" THEN montant ELSE 0 END) as entrees,
                SUM(CASE WHEN type = "Sortie" THEN montant ELSE 0 END) as sorties
            ')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Calculer le solde cumulé
        $soldeCumule = $soldeInitial;
        $mouvements = $mouvements->map(function ($m) use (&$soldeCumule) {
            $soldeCumule += $m->entrees - $m->sorties;
            $m->solde_cumule = $soldeCumule;
            return $m;
        });

        // Par catégorie
        $parCategorie = MouvementCaisse::whereBetween('date_mouvement', [$dateDebut, $dateFin])
            ->selectRaw('type, categorie, SUM(montant) as total')
            ->groupBy('type', 'categorie')
            ->get();

        return response()->json([
            'solde_initial' => $soldeInitial,
            'solde_final' => $soldeCumule,
            'total_entrees' => $mouvements->sum('entrees'),
            'total_sorties' => $mouvements->sum('sorties'),
            'mouvements' => $mouvements,
            'par_categorie' => $parCategorie,
        ]);
    }

    public function rentabilite(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        // Chiffre d'affaires
        $ca = Facture::whereYear('date', $annee)
            ->whereIn('statut', ['Envoyée', 'Partiellement payée', 'Payée'])
            ->sum('montant_ht');

        // Dépenses (sorties de caisse hors remboursements crédit et primes)
        $depenses = MouvementCaisse::whereYear('date_mouvement', $annee)
            ->where('type', 'Sortie')
            ->whereNotIn('categorie', ['Remboursement crédit', 'Prime représentant'])
            ->sum('montant');

        // Charges financières (remboursements crédit - intérêts)
        $chargesFinancieres = CreditBancaire::whereYear('date_debut', '<=', $annee)
            ->where(function ($q) use ($annee) {
                $q->whereYear('date_fin', '>=', $annee)
                  ->orWhereNull('date_fin');
            })
            ->sum('montant_interet') / 12 * 12; // Approximation

        // Primes
        $primes = MouvementCaisse::whereYear('date_mouvement', $annee)
            ->where('categorie', 'Prime représentant')
            ->sum('montant');

        $resultatBrut = $ca - $depenses;
        $resultatNet = $resultatBrut - $chargesFinancieres - $primes;

        return response()->json([
            'annee' => $annee,
            'chiffre_affaires' => $ca,
            'depenses_exploitation' => $depenses,
            'resultat_brut' => $resultatBrut,
            'charges_financieres' => $chargesFinancieres,
            'primes' => $primes,
            'resultat_net' => $resultatNet,
            'marge_brute' => $ca > 0 ? round(($resultatBrut / $ca) * 100, 2) : 0,
            'marge_nette' => $ca > 0 ? round(($resultatNet / $ca) * 100, 2) : 0,
        ]);
    }

    public function activiteClients(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfYear());
        $dateFin = $request->get('date_fin', now()->endOfYear());

        $clients = Client::withCount([
            'factures' => fn($q) => $q->whereBetween('date', [$dateDebut, $dateFin]),
        ])
        ->withSum([
            'factures' => fn($q) => $q->whereBetween('date', [$dateDebut, $dateFin]),
        ], 'montant_ttc')
        ->withSum([
            'paiements' => fn($q) => $q->whereBetween('date_paiement', [$dateDebut, $dateFin]),
        ], 'montant')
        ->get()
        ->map(function ($client) {
            $client->solde = ($client->factures_sum_montant_ttc ?? 0) - ($client->paiements_sum_montant ?? 0);
            return $client;
        })
        ->sortByDesc('factures_sum_montant_ttc')
        ->values();

        return response()->json([
            'clients' => $clients,
            'total_facture' => $clients->sum('factures_sum_montant_ttc'),
            'total_paye' => $clients->sum('paiements_sum_montant'),
            'total_solde' => $clients->sum('solde'),
        ]);
    }

    public function comparatif(Request $request): JsonResponse
    {
        $annee1 = $request->get('annee1', date('Y') - 1);
        $annee2 = $request->get('annee2', date('Y'));

        $getData = function ($annee) {
            return [
                'annee' => $annee,
                'ca' => Facture::whereYear('date', $annee)
                    ->whereIn('statut', ['Envoyée', 'Partiellement payée', 'Payée'])
                    ->sum('montant_ttc'),
                'paiements' => Paiement::whereYear('date_paiement', $annee)->sum('montant'),
                'factures' => Facture::whereYear('date', $annee)->count(),
                'nouveaux_clients' => Client::whereYear('created_at', $annee)->count(),
            ];
        };

        $data1 = $getData($annee1);
        $data2 = $getData($annee2);

        $variation = function ($v1, $v2) {
            if ($v1 == 0) return $v2 > 0 ? 100 : 0;
            return round((($v2 - $v1) / $v1) * 100, 2);
        };

        return response()->json([
            'periode_1' => $data1,
            'periode_2' => $data2,
            'variations' => [
                'ca' => $variation($data1['ca'], $data2['ca']),
                'paiements' => $variation($data1['paiements'], $data2['paiements']),
                'factures' => $variation($data1['factures'], $data2['factures']),
                'nouveaux_clients' => $variation($data1['nouveaux_clients'], $data2['nouveaux_clients']),
            ],
        ]);
    }
}
