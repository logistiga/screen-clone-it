<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PrevisionResource;
use App\Models\Prevision;
use App\Models\MouvementCaisse;
use App\Models\Paiement;
use App\Services\PrevisionSyncService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Stats mensuelles, historique, sync et export des prévisions
 */
class PrevisionStatsController extends Controller
{
    public function statsMensuelles(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $mois = (int) $request->get('mois', date('n'));

        $syncService = app(PrevisionSyncService::class);
        $syncService->syncMois($annee, $mois);

        $previsions = Prevision::where('annee', $annee)->where('mois', $mois)->get();

        $reelsCaisse = $this->getReelsCaisseMois($annee, $mois);
        $reelsBanque = $this->getReelsBanqueMois($annee, $mois);

        $totalEntreesCaisse = $reelsCaisse['entrees'];
        $totalSortiesCaisse = $reelsCaisse['sorties'];
        $totalEntreesBanque = $reelsBanque['entrees'];
        $totalSortiesBanque = $reelsBanque['sorties'];

        $totalEntreesReelles = $totalEntreesCaisse + $totalEntreesBanque;
        $totalSortiesReelles = $totalSortiesCaisse + $totalSortiesBanque;
        $beneficeMois = $totalEntreesReelles - $totalSortiesReelles;

        $totalRecettesPrevu = $previsions->where('type', 'recette')->sum('montant_prevu');
        $totalDepensesPrevu = $previsions->where('type', 'depense')->sum('montant_prevu');
        $soldePrevuMois = $totalRecettesPrevu - $totalDepensesPrevu;

        $ecartRecettes = $totalEntreesReelles - $totalRecettesPrevu;
        $ecartDepenses = $totalSortiesReelles - $totalDepensesPrevu;
        $ecartGlobal = $beneficeMois - $soldePrevuMois;

        $detailRecettes = $previsions->where('type', 'recette')->map(fn($p) => [
            'id' => $p->id, 'categorie' => $p->categorie,
            'montant_prevu' => (float) $p->montant_prevu,
            'realise_caisse' => (float) $p->realise_caisse,
            'realise_banque' => (float) $p->realise_banque,
            'montant_realise' => $p->montant_realise,
            'taux' => $p->taux_realisation, 'ecart' => $p->ecart, 'statut' => $p->statut,
        ])->values();

        $detailDepenses = $previsions->where('type', 'depense')->map(fn($p) => [
            'id' => $p->id, 'categorie' => $p->categorie,
            'montant_prevu' => (float) $p->montant_prevu,
            'realise_caisse' => (float) $p->realise_caisse,
            'realise_banque' => (float) $p->realise_banque,
            'montant_realise' => $p->montant_realise,
            'taux' => $p->taux_realisation, 'ecart' => $p->ecart, 'statut' => $p->statut,
        ])->values();

        $alertes = [];
        if ($totalSortiesReelles > $totalDepensesPrevu) {
            $alertes[] = ['type' => 'danger', 'message' => 'Les dépenses réelles dépassent le budget prévu de ' . number_format($totalSortiesReelles - $totalDepensesPrevu, 0, ',', ' ') . ' FCFA'];
        }
        if ($beneficeMois < 0) {
            $alertes[] = ['type' => 'danger', 'message' => 'Le mois est déficitaire de ' . number_format(abs($beneficeMois), 0, ',', ' ') . ' FCFA'];
        }
        if ($totalEntreesReelles < $totalRecettesPrevu * 0.5) {
            $alertes[] = ['type' => 'warning', 'message' => 'Les recettes sont inférieures à 50% des prévisions'];
        }

        $moisNoms = [1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril', 5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août', 9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'];

        return response()->json([
            'periode' => ['mois' => $mois, 'mois_nom' => $moisNoms[$mois], 'annee' => $annee],
            'synthese' => [
                'recettes' => ['prevu' => $totalRecettesPrevu, 'realise' => $totalEntreesReelles, 'caisse' => $totalEntreesCaisse, 'banque' => $totalEntreesBanque, 'ecart' => $ecartRecettes, 'taux' => $totalRecettesPrevu > 0 ? round(($totalEntreesReelles / $totalRecettesPrevu) * 100, 1) : 0],
                'depenses' => ['prevu' => $totalDepensesPrevu, 'realise' => $totalSortiesReelles, 'caisse' => $totalSortiesCaisse, 'banque' => $totalSortiesBanque, 'ecart' => $ecartDepenses, 'taux' => $totalDepensesPrevu > 0 ? round(($totalSortiesReelles / $totalDepensesPrevu) * 100, 1) : 0],
                'solde_prevu' => $soldePrevuMois, 'benefice' => $beneficeMois, 'ecart_global' => $ecartGlobal,
                'situation' => $beneficeMois >= 0 ? 'beneficiaire' : 'deficitaire',
                'dans_budget' => $totalSortiesReelles <= $totalDepensesPrevu,
            ],
            'details' => ['recettes' => $detailRecettes, 'depenses' => $detailDepenses],
            'alertes' => $alertes,
            'nb_previsions' => $previsions->count(),
        ]);
    }

    public function historique(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));

        $moisNoms = [1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril', 5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août', 9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'];

        $historique = [];
        for ($m = 1; $m <= 12; $m++) {
            $previsions = Prevision::where('annee', $annee)->where('mois', $m)->get();
            $reelsCaisse = $this->getReelsCaisseMois($annee, $m);
            $reelsBanque = $this->getReelsBanqueMois($annee, $m);

            $totalEntrees = $reelsCaisse['entrees'] + $reelsBanque['entrees'];
            $totalSorties = $reelsCaisse['sorties'] + $reelsBanque['sorties'];

            $historique[] = [
                'mois' => $m, 'mois_nom' => $moisNoms[$m],
                'recettes_prevues' => $previsions->where('type', 'recette')->sum('montant_prevu'),
                'recettes_realisees' => $totalEntrees,
                'depenses_prevues' => $previsions->where('type', 'depense')->sum('montant_prevu'),
                'depenses_realisees' => $totalSorties,
                'benefice' => $totalEntrees - $totalSorties,
                'solde_prevu' => $previsions->where('type', 'recette')->sum('montant_prevu') - $previsions->where('type', 'depense')->sum('montant_prevu'),
                'nb_previsions' => $previsions->count(),
            ];
        }

        $totaux = [
            'recettes_prevues' => array_sum(array_column($historique, 'recettes_prevues')),
            'recettes_realisees' => array_sum(array_column($historique, 'recettes_realisees')),
            'depenses_prevues' => array_sum(array_column($historique, 'depenses_prevues')),
            'depenses_realisees' => array_sum(array_column($historique, 'depenses_realisees')),
            'benefice_total' => array_sum(array_column($historique, 'benefice')),
            'solde_prevu_total' => array_sum(array_column($historique, 'solde_prevu')),
        ];

        return response()->json(['annee' => $annee, 'historique' => $historique, 'totaux' => $totaux]);
    }

    public function syncRealise(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $mois = (int) $request->get('mois', date('n'));

        $syncService = app(PrevisionSyncService::class);
        $updated = $syncService->syncMois($annee, $mois);

        return response()->json(['message' => "Synchronisation effectuée pour {$updated} prévisions", 'mois' => $mois, 'annee' => $annee, 'updated' => $updated]);
    }

    public function exportMois(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $mois = (int) $request->get('mois', date('n'));

        $statsRequest = new Request(['annee' => $annee, 'mois' => $mois]);
        $stats = $this->statsMensuelles($statsRequest)->getData(true);

        $previsions = Prevision::where('annee', $annee)->where('mois', $mois)->orderBy('type')->orderBy('categorie')->get();

        return response()->json(['stats' => $stats, 'previsions' => PrevisionResource::collection($previsions), 'date_export' => now()->toISOString()]);
    }

    public function stats(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $previsions = Prevision::where('annee', $annee)->get();

        $totalRecettesPrevu = $previsions->where('type', 'recette')->sum('montant_prevu');
        $totalDepensesPrevu = $previsions->where('type', 'depense')->sum('montant_prevu');

        $totalEntrees = 0;
        $totalSorties = 0;
        for ($m = 1; $m <= 12; $m++) {
            $reelsCaisse = $this->getReelsCaisseMois($annee, $m);
            $reelsBanque = $this->getReelsBanqueMois($annee, $m);
            $totalEntrees += $reelsCaisse['entrees'] + $reelsBanque['entrees'];
            $totalSorties += $reelsCaisse['sorties'] + $reelsBanque['sorties'];
        }

        $compteurs = [
            'en_cours' => $previsions->where('statut', 'en_cours')->count(),
            'atteint' => $previsions->where('statut', 'atteint')->count(),
            'depasse' => $previsions->where('statut', 'depasse')->count(),
            'non_atteint' => $previsions->where('statut', 'non_atteint')->count(),
        ];

        return response()->json([
            'annee' => $annee,
            'stats' => [
                'recettes' => ['prevu' => $totalRecettesPrevu, 'realise' => $totalEntrees],
                'depenses' => ['prevu' => $totalDepensesPrevu, 'realise' => $totalSorties],
            ],
            'total_prevu' => $totalRecettesPrevu + $totalDepensesPrevu,
            'total_realise' => $totalEntrees + $totalSorties,
            'taux_recettes' => $totalRecettesPrevu > 0 ? round(($totalEntrees / $totalRecettesPrevu) * 100, 1) : 0,
            'taux_depenses' => $totalDepensesPrevu > 0 ? round(($totalSorties / $totalDepensesPrevu) * 100, 1) : 0,
            'taux_global' => $totalRecettesPrevu + $totalDepensesPrevu > 0 ? round((($totalEntrees + $totalSorties) / ($totalRecettesPrevu + $totalDepensesPrevu)) * 100, 1) : 0,
            'compteurs' => $compteurs,
            'benefice_annee' => $totalEntrees - $totalSorties,
        ]);
    }

    // ==================== Méthodes privées ====================

    private function getReelsCaisseMois(int $annee, int $mois): array
    {
        $mouvements = MouvementCaisse::whereYear('date', $annee)->whereMonth('date', $mois)->get();

        return [
            'entrees' => (float) $mouvements->filter(fn($m) => in_array(strtolower($m->type), ['entree', 'entrée']))->sum('montant'),
            'sorties' => (float) $mouvements->filter(fn($m) => in_array(strtolower($m->type), ['sortie']))->sum('montant'),
        ];
    }

    private function getReelsBanqueMois(int $annee, int $mois): array
    {
        $paiementsRecus = Paiement::whereYear('date', $annee)->whereMonth('date', $mois)->sum('montant');

        $sortiesBanque = MouvementCaisse::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->where('source', 'banque')
            ->where(function($q) { $q->where('type', 'sortie')->orWhere('type', 'Sortie'); })
            ->sum('montant');

        return ['entrees' => (float) $paiementsRecus, 'sorties' => (float) $sortiesBanque];
    }
}
