<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Models\Devis;
use App\Models\Paiement;
use App\Models\Annulation;
use App\Services\Reporting\ReportingFinanceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

/**
 * Façade ReportingService — rentabilité/trésorerie déléguées à ReportingFinanceService
 */
class ReportingService
{
    protected ReportingFinanceService $finance;

    public function __construct()
    {
        $this->finance = new ReportingFinanceService();
    }

    // === Délégation finance ===
    public function getRentabilite(int $annee): array { return $this->finance->getRentabilite($annee); }
    public function getTresorerie(string $dateDebut, string $dateFin): array { return $this->finance->getTresorerie($dateDebut, $dateFin); }

    // === CA ===
    public function getChiffreAffaires(int $annee, ?int $mois = null): array
    {
        $query = Facture::whereYear('date_creation', $annee)
            ->whereIn('statut', ['Envoyée', 'Partiellement payée', 'Payée', 'validee', 'partiellement_payee', 'payee', 'partielle']);

        if ($mois) $query->whereMonth('date_creation', $mois);

        $parMois = (clone $query)
            ->selectRaw('MONTH(date_creation) as mois, SUM(montant_ht) as total_ht, SUM(tva) as total_tva, SUM(css) as total_css, SUM(montant_ttc) as total_ttc, COUNT(*) as nombre_factures')
            ->groupBy('mois')->orderBy('mois')->get();

        $totaux = [
            'total_ht' => $parMois->sum('total_ht'), 'total_tva' => $parMois->sum('total_tva'),
            'total_css' => $parMois->sum('total_css'), 'total_ttc' => $parMois->sum('total_ttc'),
            'nombre_factures' => $parMois->sum('nombre_factures'),
        ];

        return ['annee' => $annee, 'mois' => $mois, 'par_mois' => $parMois, 'totaux' => $totaux, 'evolution' => $this->calculerEvolutionMensuelle($parMois)];
    }

    // === Créances ===
    public function getCreances(): array
    {
        $factures = Facture::with('client')
            ->whereIn('statut', ['Envoyée', 'Partiellement payée', 'validee', 'partiellement_payee'])
            ->get()
            ->map(function ($facture) {
                $paye = $facture->paiements()->sum('montant');
                $resteAPayer = $facture->montant_ttc - $paye;
                $joursRetard = ($facture->date_echeance && $facture->date_echeance < now()) ? now()->diffInDays($facture->date_echeance) : 0;
                return [
                    'facture_id' => $facture->id, 'facture_numero' => $facture->numero,
                    'client_id' => $facture->client_id, 'client_nom' => $facture->client->nom ?? 'N/A',
                    'montant_ttc' => $facture->montant_ttc, 'montant_paye' => $paye,
                    'reste_a_payer' => $resteAPayer, 'date_echeance' => $facture->date_echeance,
                    'jours_retard' => $joursRetard,
                ];
            });

        $tranches = [
            'a_jour' => $factures->filter(fn($f) => $f['jours_retard'] == 0)->sum('reste_a_payer'),
            '1_30_jours' => $factures->filter(fn($f) => $f['jours_retard'] > 0 && $f['jours_retard'] <= 30)->sum('reste_a_payer'),
            '31_60_jours' => $factures->filter(fn($f) => $f['jours_retard'] > 30 && $f['jours_retard'] <= 60)->sum('reste_a_payer'),
            '61_90_jours' => $factures->filter(fn($f) => $f['jours_retard'] > 60 && $f['jours_retard'] <= 90)->sum('reste_a_payer'),
            'plus_90_jours' => $factures->filter(fn($f) => $f['jours_retard'] > 90)->sum('reste_a_payer'),
        ];

        $parClient = $factures->groupBy('client_id')->map(function ($group) {
            return [
                'client_id' => $group->first()['client_id'], 'client_nom' => $group->first()['client_nom'],
                'nombre_factures' => $group->count(), 'total_du' => $group->sum('montant_ttc'),
                'total_paye' => $group->sum('montant_paye'), 'total_restant' => $group->sum('reste_a_payer'),
                'max_jours_retard' => $group->max('jours_retard'),
            ];
        })->sortByDesc('total_restant')->values();

        return [
            'total_creances' => $factures->sum('reste_a_payer'), 'nombre_factures' => $factures->count(),
            'par_tranche_age' => $tranches, 'par_client' => $parClient, 'top_debiteurs' => $parClient->take(10),
        ];
    }

    // === Comparatif ===
    public function getComparatif(int $annee1, int $annee2): array
    {
        $getData = function ($annee) {
            return [
                'annee' => $annee,
                'ca_ht' => Facture::whereYear('date_creation', $annee)->whereIn('statut', ['Envoyée', 'Partiellement payée', 'Payée', 'validee', 'partiellement_payee', 'payee', 'partielle'])->sum('montant_ht'),
                'ca_ttc' => Facture::whereYear('date_creation', $annee)->whereIn('statut', ['Envoyée', 'Partiellement payée', 'Payée', 'validee', 'partiellement_payee', 'payee', 'partielle'])->sum('montant_ttc'),
                'paiements' => Paiement::whereYear('date', $annee)->sum('montant'),
                'nombre_factures' => Facture::whereYear('date_creation', $annee)->count(),
                'nombre_ordres' => OrdreTravail::whereYear('date_creation', $annee)->count(),
                'nombre_devis' => Devis::whereYear('date_creation', $annee)->count(),
                'nouveaux_clients' => Client::whereYear('created_at', $annee)->count(),
                'annulations' => Annulation::whereYear('date', $annee)->count(),
            ];
        };

        $data1 = $getData($annee1);
        $data2 = $getData($annee2);
        $calculerVariation = fn($v1, $v2) => $v1 == 0 ? ($v2 > 0 ? 100 : 0) : round((($v2 - $v1) / $v1) * 100, 2);

        $variations = [];
        foreach (array_keys($data1) as $key) {
            if ($key !== 'annee') $variations[$key] = $calculerVariation($data1[$key], $data2[$key]);
        }

        return ['periode_1' => $data1, 'periode_2' => $data2, 'variations' => $variations];
    }

    // === Activité clients ===
    public function getActiviteClients(string $dateDebut, string $dateFin, int $limit = 20): array
    {
        $clients = Client::withCount([
            'factures' => fn($q) => $q->whereBetween('date_creation', [$dateDebut, $dateFin]),
            'ordresTravail' => fn($q) => $q->whereBetween('date_creation', [$dateDebut, $dateFin]),
            'devis' => fn($q) => $q->whereBetween('date_creation', [$dateDebut, $dateFin]),
        ])
        ->withSum(['factures' => fn($q) => $q->whereBetween('date_creation', [$dateDebut, $dateFin])], 'montant_ttc')
        ->withSum(['paiements' => fn($q) => $q->whereBetween('date', [$dateDebut, $dateFin])], 'montant')
        ->get()
        ->map(function ($client) {
            $client->solde = ($client->factures_sum_montant_ttc ?? 0) - ($client->paiements_sum_montant ?? 0);
            $client->taux_paiement = ($client->factures_sum_montant_ttc ?? 0) > 0 
                ? round((($client->paiements_sum_montant ?? 0) / $client->factures_sum_montant_ttc) * 100, 2) : 100;
            $client->nom = $client->raison_sociale ?? $client->nom_complet ?? 'Client #' . $client->id;
            return $client;
        })
        ->filter(fn($c) => ($c->factures_sum_montant_ttc ?? 0) > 0)
        ->sortByDesc('factures_sum_montant_ttc');

        return [
            'periode' => ['debut' => $dateDebut, 'fin' => $dateFin],
            'top_clients' => $clients->take($limit)->values()->toArray(),
            'totaux' => [
                'nombre_clients_actifs' => $clients->count(),
                'total_facture' => $clients->sum('factures_sum_montant_ttc'),
                'total_paye' => $clients->sum('paiements_sum_montant'),
                'total_solde' => $clients->sum('solde'),
            ],
        ];
    }

    // === Stats documents ===
    public function getStatistiquesDocuments(int $annee): array
    {
        $devis = Devis::whereYear('date_creation', $annee)->selectRaw('statut, COUNT(*) as nombre, SUM(montant_ttc) as montant')->groupBy('statut')->get();
        $ordres = OrdreTravail::whereYear('date_creation', $annee)->selectRaw('statut, COUNT(*) as nombre, SUM(montant_ttc) as montant')->groupBy('statut')->get();
        $factures = Facture::whereYear('date_creation', $annee)->selectRaw('statut, COUNT(*) as nombre, SUM(montant_ttc) as montant')->groupBy('statut')->get();

        $devisTotal = Devis::whereYear('date_creation', $annee)->count();
        $devisConvertis = Devis::whereYear('date_creation', $annee)->where('statut', 'converti')->count();
        $ordresTotal = OrdreTravail::whereYear('date_creation', $annee)->count();
        $ordresFactures = OrdreTravail::whereYear('date_creation', $annee)->where('statut', 'facture')->count();

        return [
            'annee' => $annee,
            'devis' => ['par_statut' => $devis, 'total' => $devisTotal, 'taux_conversion' => $devisTotal > 0 ? round(($devisConvertis / $devisTotal) * 100, 2) : 0],
            'ordres' => ['par_statut' => $ordres, 'total' => $ordresTotal, 'taux_conversion' => $ordresTotal > 0 ? round(($ordresFactures / $ordresTotal) * 100, 2) : 0],
            'factures' => ['par_statut' => $factures, 'total' => Facture::whereYear('date_creation', $annee)->count()],
        ];
    }

    // === Tableau de bord ===
    public function getTableauDeBord(int $annee): array
    {
        $rentabilite = $this->getRentabilite($annee);
        $creances = $this->getCreances();
        $documents = $this->getStatistiquesDocuments($annee);

        $moisCourant = (int) date('n');
        $anneeCourante = (int) date('Y');
        $caMoisCourant = $annee === $anneeCourante
            ? (float) Facture::whereYear('date_creation', $annee)->whereMonth('date_creation', $moisCourant)
                ->whereIn('statut', ['Envoyée', 'Partiellement payée', 'Payée', 'validee', 'partiellement_payee', 'payee', 'partielle'])->sum('montant_ttc')
            : 0;

        $nbClients = Client::whereHas('factures', fn($q) => $q->whereYear('date_creation', $annee))->count();
        $caTotal = $rentabilite['chiffre_affaires_ttc'];
        $tauxRecouvrement = $caTotal > 0 ? round((($caTotal - $creances['total_creances']) / $caTotal) * 100, 2) : 0;

        $kpis = [
            'ca_total' => $caTotal, 'ca_mois_courant' => $caMoisCourant,
            'creances_totales' => $creances['total_creances'], 'taux_recouvrement' => max(0, $tauxRecouvrement),
            'nb_factures' => $documents['factures']['total'] ?? 0, 'nb_ordres' => $documents['ordres']['total'] ?? 0,
            'nb_devis' => $documents['devis']['total'] ?? 0, 'nb_clients' => $nbClients,
        ];

        return [
            'annee' => $annee, 'kpis' => $kpis, 'indicateurs' => $kpis,
            'rentabilite' => $rentabilite, 'creances' => $creances, 'documents' => $documents,
            'alertes' => $this->genererAlertes($creances, $rentabilite),
        ];
    }

    // === Helpers ===
    protected function calculerEvolutionMensuelle(Collection $parMois): array
    {
        $evolution = [];
        $previousValue = null;
        foreach ($parMois as $mois) {
            $variation = ($previousValue !== null && $previousValue > 0) ? round((($mois->total_ttc - $previousValue) / $previousValue) * 100, 2) : null;
            $evolution[$mois->mois] = $variation;
            $previousValue = $mois->total_ttc;
        }
        return $evolution;
    }

    protected function genererAlertes(array $creances, array $rentabilite): array
    {
        $alertes = [];
        if (($creances['par_tranche_age']['plus_90_jours'] ?? 0) > 0) {
            $alertes[] = ['type' => 'danger', 'message' => "Créances de plus de 90 jours : " . number_format($creances['par_tranche_age']['plus_90_jours'], 0, ',', ' ') . " FCFA"];
        }
        if ($rentabilite['marge_nette_pct'] < 10 && $rentabilite['chiffre_affaires_ht'] > 0) {
            $alertes[] = ['type' => 'warning', 'message' => "Marge nette faible : {$rentabilite['marge_nette_pct']}%"];
        }
        if ($rentabilite['resultat_net'] < 0) {
            $alertes[] = ['type' => 'danger', 'message' => "Résultat net négatif : " . number_format($rentabilite['resultat_net'], 0, ',', ' ') . " FCFA"];
        }
        return $alertes;
    }
}
