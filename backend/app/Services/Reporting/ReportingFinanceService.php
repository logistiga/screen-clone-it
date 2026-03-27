<?php

namespace App\Services\Reporting;

use App\Models\Facture;
use App\Models\MouvementCaisse;
use App\Models\CreditBancaire;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

/**
 * Sous-service reporting : rentabilité, trésorerie, charges financières
 */
class ReportingFinanceService
{
    public function getRentabilite(int $annee): array
    {
        $statutsValides = ['Envoyée', 'Partiellement payée', 'Payée', 'validee', 'partiellement_payee', 'payee', 'partielle'];

        $caHT = Facture::whereYear('date_creation', $annee)->whereIn('statut', $statutsValides)->sum('montant_ht');
        $caTTC = Facture::whereYear('date_creation', $annee)->whereIn('statut', $statutsValides)->sum('montant_ttc');

        $depensesExploitation = MouvementCaisse::whereYear('date', $annee)
            ->where('type', 'sortie')
            ->whereNotIn('categorie', ['Remboursement crédit', 'Prime représentant', 'remboursement_credit', 'prime'])
            ->sum('montant');

        $chargesFinancieres = $this->getChargesFinancieres($annee);

        $primes = MouvementCaisse::whereYear('date', $annee)
            ->whereIn('categorie', ['Prime représentant', 'prime'])
            ->sum('montant');

        $resultatBrut = $caHT - $depensesExploitation;
        $resultatNet = $resultatBrut - $chargesFinancieres - $primes;
        $margeBrute = $caHT > 0 ? round(($resultatBrut / $caHT) * 100, 2) : 0;
        $margeNette = $caHT > 0 ? round(($resultatNet / $caHT) * 100, 2) : 0;

        $rentabiliteParMois = $this->getRentabiliteParMois($annee);

        return [
            'annee' => $annee,
            'chiffre_affaires_ht' => $caHT,
            'chiffre_affaires_ttc' => $caTTC,
            'depenses_exploitation' => $depensesExploitation,
            'resultat_brut' => $resultatBrut,
            'charges_financieres' => $chargesFinancieres,
            'primes' => $primes,
            'resultat_net' => $resultatNet,
            'marge_brute_pct' => $margeBrute,
            'marge_nette_pct' => $margeNette,
            'par_mois' => $rentabiliteParMois,
        ];
    }

    public function getTresorerie(string $dateDebut, string $dateFin): array
    {
        $soldeInitial = MouvementCaisse::where('date', '<', $dateDebut)
            ->selectRaw('
                COALESCE(SUM(CASE WHEN type = "entree" OR type = "Entrée" THEN montant ELSE 0 END), 0) - 
                COALESCE(SUM(CASE WHEN type = "sortie" OR type = "Sortie" THEN montant ELSE 0 END), 0) as solde
            ')
            ->value('solde') ?? 0;

        $mouvements = MouvementCaisse::whereBetween('date', [$dateDebut, $dateFin])
            ->selectRaw('
                DATE(date) as jour,
                SUM(CASE WHEN type = "entree" OR type = "Entrée" THEN montant ELSE 0 END) as entrees,
                SUM(CASE WHEN type = "sortie" OR type = "Sortie" THEN montant ELSE 0 END) as sorties
            ')
            ->groupBy('jour')
            ->orderBy('jour')
            ->get();

        $soldeCumule = $soldeInitial;
        $mouvements = $mouvements->map(function ($m) use (&$soldeCumule) {
            $soldeCumule += $m->entrees - $m->sorties;
            $m->solde_cumule = $soldeCumule;
            return $m;
        });

        $parCategorie = MouvementCaisse::whereBetween('date', [$dateDebut, $dateFin])
            ->selectRaw('type, categorie, SUM(montant) as total, COUNT(*) as nombre')
            ->groupBy('type', 'categorie')
            ->get();

        return [
            'periode' => ['debut' => $dateDebut, 'fin' => $dateFin],
            'solde_initial' => $soldeInitial,
            'solde_final' => $soldeCumule,
            'total_entrees' => $mouvements->sum('entrees'),
            'total_sorties' => $mouvements->sum('sorties'),
            'variation' => $mouvements->sum('entrees') - $mouvements->sum('sorties'),
            'mouvements_quotidiens' => $mouvements,
            'par_categorie' => $parCategorie,
        ];
    }

    public function getChargesFinancieres(int $annee): float
    {
        $finAnnee = "{$annee}-12-31";
        return (float) CreditBancaire::where('statut', 'actif')
            ->whereDate('date_debut', '<=', $finAnnee)
            ->sum('total_interets');
    }

    protected function getRentabiliteParMois(int $annee): Collection
    {
        return DB::table('factures')
            ->selectRaw('MONTH(date_creation) as mois')
            ->selectRaw('SUM(montant_ht) as ca')
            ->whereYear('date_creation', $annee)
            ->whereIn('statut', ['Envoyée', 'Partiellement payée', 'Payée', 'validee', 'partiellement_payee', 'payee', 'partielle'])
            ->whereNull('deleted_at')
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();
    }
}
