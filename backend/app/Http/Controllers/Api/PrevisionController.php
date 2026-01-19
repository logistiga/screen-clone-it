<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrevisionRequest;
use App\Http\Requests\UpdatePrevisionRequest;
use App\Http\Resources\PrevisionResource;
use App\Models\Prevision;
use App\Models\Audit;
use App\Models\MouvementCaisse;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PrevisionController extends Controller
{
    /**
     * Liste des prévisions avec filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = Prevision::with(['user']);

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->has('mois')) {
            $query->where('mois', $request->get('mois'));
        }

        if ($request->has('annee')) {
            $query->where('annee', $request->get('annee'));
        }

        $previsions = $query->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->orderBy('type')
            ->orderBy('categorie')
            ->paginate($request->get('per_page', 50));

        return response()->json(PrevisionResource::collection($previsions)->response()->getData(true));
    }

    /**
     * Créer une nouvelle prévision
     */
    public function store(StorePrevisionRequest $request): JsonResponse
    {
        $exists = Prevision::where('type', $request->type)
            ->where('categorie', $request->categorie)
            ->where('mois', $request->mois)
            ->where('annee', $request->annee)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Une prévision existe déjà pour cette catégorie et cette période'
            ], 422);
        }

        $prevision = Prevision::create([
            'type' => $request->type,
            'categorie' => $request->categorie,
            'description' => $request->description,
            'montant_prevu' => $request->montant_prevu,
            'realise_caisse' => 0,
            'realise_banque' => 0,
            'mois' => $request->mois,
            'annee' => $request->annee,
            'statut' => 'en_cours',
            'notes' => $request->notes,
            'user_id' => auth()->id(),
        ]);

        Audit::log('create', 'prevision', "Prévision créée: {$request->type} - {$request->categorie}", $prevision->id);

        return response()->json(new PrevisionResource($prevision->load(['user'])), 201);
    }

    /**
     * Afficher une prévision
     */
    public function show(Prevision $prevision): JsonResponse
    {
        $prevision->load(['user']);
        return response()->json(new PrevisionResource($prevision));
    }

    /**
     * Modifier une prévision
     */
    public function update(UpdatePrevisionRequest $request, Prevision $prevision): JsonResponse
    {
        $prevision->update($request->validated());
        $prevision->updateStatut();

        Audit::log('update', 'prevision', "Prévision modifiée", $prevision->id);

        return response()->json(new PrevisionResource($prevision->load(['user'])));
    }

    /**
     * Supprimer une prévision
     */
    public function destroy(Prevision $prevision): JsonResponse
    {
        Audit::log('delete', 'prevision', "Prévision supprimée: {$prevision->categorie}", $prevision->id);
        $prevision->delete();
        
        return response()->json(['message' => 'Prévision supprimée avec succès']);
    }

    /**
     * Statistiques mensuelles détaillées
     * C'est l'endpoint principal pour la vue mensuelle
     */
    public function statsMensuelles(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $mois = (int) $request->get('mois', date('n'));

        // Récupérer les prévisions du mois
        $previsions = Prevision::where('annee', $annee)
            ->where('mois', $mois)
            ->get();

        // Récupérer les réels du mois
        $reelsCaisse = $this->getReelsCaisseMois($annee, $mois);
        $reelsBanque = $this->getReelsBanqueMois($annee, $mois);

        // Totaux réels consolidés
        $totalEntreesCaisse = $reelsCaisse['entrees'];
        $totalSortiesCaisse = $reelsCaisse['sorties'];
        $totalEntreesBanque = $reelsBanque['entrees'];
        $totalSortiesBanque = $reelsBanque['sorties'];

        $totalEntreesReelles = $totalEntreesCaisse + $totalEntreesBanque;
        $totalSortiesReelles = $totalSortiesCaisse + $totalSortiesBanque;
        $beneficeMois = $totalEntreesReelles - $totalSortiesReelles;

        // Totaux prévus
        $totalRecettesPrevu = $previsions->where('type', 'recette')->sum('montant_prevu');
        $totalDepensesPrevu = $previsions->where('type', 'depense')->sum('montant_prevu');
        $soldePrevuMois = $totalRecettesPrevu - $totalDepensesPrevu;

        // Écart budget
        $ecartRecettes = $totalEntreesReelles - $totalRecettesPrevu;
        $ecartDepenses = $totalSortiesReelles - $totalDepensesPrevu;
        $ecartGlobal = $beneficeMois - $soldePrevuMois;

        // Détail par catégorie avec progression
        $detailRecettes = $previsions->where('type', 'recette')->map(function($p) {
            return [
                'id' => $p->id,
                'categorie' => $p->categorie,
                'montant_prevu' => (float) $p->montant_prevu,
                'realise_caisse' => (float) $p->realise_caisse,
                'realise_banque' => (float) $p->realise_banque,
                'montant_realise' => $p->montant_realise,
                'taux' => $p->taux_realisation,
                'ecart' => $p->ecart,
                'statut' => $p->statut,
            ];
        })->values();

        $detailDepenses = $previsions->where('type', 'depense')->map(function($p) {
            return [
                'id' => $p->id,
                'categorie' => $p->categorie,
                'montant_prevu' => (float) $p->montant_prevu,
                'realise_caisse' => (float) $p->realise_caisse,
                'realise_banque' => (float) $p->realise_banque,
                'montant_realise' => $p->montant_realise,
                'taux' => $p->taux_realisation,
                'ecart' => $p->ecart,
                'statut' => $p->statut,
            ];
        })->values();

        // Alertes
        $alertes = [];
        if ($totalSortiesReelles > $totalDepensesPrevu) {
            $alertes[] = [
                'type' => 'danger',
                'message' => 'Les dépenses réelles dépassent le budget prévu de ' . number_format($totalSortiesReelles - $totalDepensesPrevu, 0, ',', ' ') . ' FCFA',
            ];
        }
        if ($beneficeMois < 0) {
            $alertes[] = [
                'type' => 'danger',
                'message' => 'Le mois est déficitaire de ' . number_format(abs($beneficeMois), 0, ',', ' ') . ' FCFA',
            ];
        }
        if ($totalEntreesReelles < $totalRecettesPrevu * 0.5) {
            $alertes[] = [
                'type' => 'warning',
                'message' => 'Les recettes sont inférieures à 50% des prévisions',
            ];
        }

        $moisNoms = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];

        return response()->json([
            'periode' => [
                'mois' => $mois,
                'mois_nom' => $moisNoms[$mois],
                'annee' => $annee,
            ],
            'synthese' => [
                'recettes' => [
                    'prevu' => $totalRecettesPrevu,
                    'realise' => $totalEntreesReelles,
                    'caisse' => $totalEntreesCaisse,
                    'banque' => $totalEntreesBanque,
                    'ecart' => $ecartRecettes,
                    'taux' => $totalRecettesPrevu > 0 ? round(($totalEntreesReelles / $totalRecettesPrevu) * 100, 1) : 0,
                ],
                'depenses' => [
                    'prevu' => $totalDepensesPrevu,
                    'realise' => $totalSortiesReelles,
                    'caisse' => $totalSortiesCaisse,
                    'banque' => $totalSortiesBanque,
                    'ecart' => $ecartDepenses,
                    'taux' => $totalDepensesPrevu > 0 ? round(($totalSortiesReelles / $totalDepensesPrevu) * 100, 1) : 0,
                ],
                'solde_prevu' => $soldePrevuMois,
                'benefice' => $beneficeMois,
                'ecart_global' => $ecartGlobal,
                'situation' => $beneficeMois >= 0 ? 'beneficiaire' : 'deficitaire',
                'dans_budget' => $totalSortiesReelles <= $totalDepensesPrevu,
            ],
            'details' => [
                'recettes' => $detailRecettes,
                'depenses' => $detailDepenses,
            ],
            'alertes' => $alertes,
            'nb_previsions' => $previsions->count(),
        ]);
    }

    /**
     * Historique sur plusieurs mois
     */
    public function historique(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $nbMois = (int) $request->get('nb_mois', 12);

        $moisNoms = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];

        $historique = [];
        
        for ($m = 1; $m <= 12; $m++) {
            $previsions = Prevision::where('annee', $annee)->where('mois', $m)->get();
            $reelsCaisse = $this->getReelsCaisseMois($annee, $m);
            $reelsBanque = $this->getReelsBanqueMois($annee, $m);

            $totalEntrees = $reelsCaisse['entrees'] + $reelsBanque['entrees'];
            $totalSorties = $reelsCaisse['sorties'] + $reelsBanque['sorties'];
            $totalRecettesPrevu = $previsions->where('type', 'recette')->sum('montant_prevu');
            $totalDepensesPrevu = $previsions->where('type', 'depense')->sum('montant_prevu');

            $historique[] = [
                'mois' => $m,
                'mois_nom' => $moisNoms[$m],
                'recettes_prevues' => $totalRecettesPrevu,
                'recettes_realisees' => $totalEntrees,
                'depenses_prevues' => $totalDepensesPrevu,
                'depenses_realisees' => $totalSorties,
                'benefice' => $totalEntrees - $totalSorties,
                'solde_prevu' => $totalRecettesPrevu - $totalDepensesPrevu,
                'nb_previsions' => $previsions->count(),
            ];
        }

        // Totaux annuels
        $totaux = [
            'recettes_prevues' => array_sum(array_column($historique, 'recettes_prevues')),
            'recettes_realisees' => array_sum(array_column($historique, 'recettes_realisees')),
            'depenses_prevues' => array_sum(array_column($historique, 'depenses_prevues')),
            'depenses_realisees' => array_sum(array_column($historique, 'depenses_realisees')),
            'benefice_total' => array_sum(array_column($historique, 'benefice')),
            'solde_prevu_total' => array_sum(array_column($historique, 'solde_prevu')),
        ];

        return response()->json([
            'annee' => $annee,
            'historique' => $historique,
            'totaux' => $totaux,
        ]);
    }

    /**
     * Synchroniser les réalisés depuis les mouvements réels
     */
    public function syncRealise(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $mois = (int) $request->get('mois', date('n'));

        // Récupérer les réels
        $reelsCaisse = $this->getReelsCaisseMoisParCategorie($annee, $mois);
        $reelsBanque = $this->getReelsBanqueMoisParCategorie($annee, $mois);

        $updated = 0;
        $previsions = Prevision::where('annee', $annee)->where('mois', $mois)->get();

        foreach ($previsions as $prevision) {
            $categorie = $prevision->categorie;
            $type = $prevision->type;

            // Trouver les réels correspondants
            $realiseCaisse = 0;
            $realiseBanque = 0;

            if ($type === 'recette') {
                $realiseCaisse = $reelsCaisse['entrees'][$categorie] ?? 0;
                $realiseBanque = $reelsBanque['entrees'][$categorie] ?? 0;
            } else {
                $realiseCaisse = $reelsCaisse['sorties'][$categorie] ?? 0;
                $realiseBanque = $reelsBanque['sorties'][$categorie] ?? 0;
            }

            $prevision->update([
                'realise_caisse' => $realiseCaisse,
                'realise_banque' => $realiseBanque,
            ]);
            $prevision->updateStatut();
            $updated++;
        }

        return response()->json([
            'message' => "Synchronisation effectuée pour {$updated} prévisions",
            'mois' => $mois,
            'annee' => $annee,
            'updated' => $updated,
        ]);
    }

    /**
     * Catégories disponibles
     */
    public function categories(): JsonResponse
    {
        $categoriesEntree = \App\Models\CategorieDepense::where('type', 'Entrée')
            ->where('actif', true)
            ->orderBy('nom')
            ->pluck('nom')
            ->toArray();

        $categoriesSortie = \App\Models\CategorieDepense::where('type', 'Sortie')
            ->where('actif', true)
            ->orderBy('nom')
            ->pluck('nom')
            ->toArray();

        if (empty($categoriesEntree)) {
            $categoriesEntree = Prevision::getCategoriesRecettes();
        }
        if (empty($categoriesSortie)) {
            $categoriesSortie = Prevision::getCategoriesDepenses();
        }

        return response()->json([
            'recette' => $categoriesEntree,
            'depense' => $categoriesSortie,
        ]);
    }

    /**
     * Export des données pour PDF
     */
    public function exportMois(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $mois = (int) $request->get('mois', date('n'));

        // Réutiliser la logique de stats mensuelles
        $statsRequest = new Request(['annee' => $annee, 'mois' => $mois]);
        $stats = $this->statsMensuelles($statsRequest)->getData(true);

        // Ajouter les détails des prévisions
        $previsions = Prevision::where('annee', $annee)
            ->where('mois', $mois)
            ->orderBy('type')
            ->orderBy('categorie')
            ->get();

        return response()->json([
            'stats' => $stats,
            'previsions' => PrevisionResource::collection($previsions),
            'date_export' => now()->toISOString(),
        ]);
    }

    // ==================== Méthodes privées ====================

    private function getReelsCaisseMois(int $annee, int $mois): array
    {
        $mouvements = MouvementCaisse::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->get();

        $entrees = $mouvements->filter(function($m) {
            return in_array(strtolower($m->type), ['entree', 'entrée']);
        })->sum('montant');

        $sorties = $mouvements->filter(function($m) {
            return in_array(strtolower($m->type), ['sortie']);
        })->sum('montant');

        return [
            'entrees' => (float) $entrees,
            'sorties' => (float) $sorties,
        ];
    }

    private function getReelsBanqueMois(int $annee, int $mois): array
    {
        // Paiements reçus = entrées banque
        $paiementsRecus = Paiement::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->sum('montant');

        // Pour les sorties bancaires, on pourrait les déduire des mouvements caisse avec source=banque
        $sortiesBanque = MouvementCaisse::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->where('source', 'banque')
            ->where(function($q) {
                $q->where('type', 'sortie')->orWhere('type', 'Sortie');
            })
            ->sum('montant');

        return [
            'entrees' => (float) $paiementsRecus,
            'sorties' => (float) $sortiesBanque,
        ];
    }

    private function getReelsCaisseMoisParCategorie(int $annee, int $mois): array
    {
        $mouvements = MouvementCaisse::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->where('source', 'caisse')
            ->get();

        $entrees = [];
        $sorties = [];

        foreach ($mouvements as $m) {
            $cat = $m->categorie ?: 'Autres';
            if (in_array(strtolower($m->type), ['entree', 'entrée'])) {
                $entrees[$cat] = ($entrees[$cat] ?? 0) + (float) $m->montant;
            } else {
                $sorties[$cat] = ($sorties[$cat] ?? 0) + (float) $m->montant;
            }
        }

        return ['entrees' => $entrees, 'sorties' => $sorties];
    }

    private function getReelsBanqueMoisParCategorie(int $annee, int $mois): array
    {
        // Paiements par référence/notes comme catégorie
        $paiements = Paiement::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->get();

        $entrees = ['Paiements clients' => 0];
        foreach ($paiements as $p) {
            $entrees['Paiements clients'] += (float) $p->montant;
        }

        // Sorties banque par catégorie
        $mouvements = MouvementCaisse::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->where('source', 'banque')
            ->where(function($q) {
                $q->where('type', 'sortie')->orWhere('type', 'Sortie');
            })
            ->get();

        $sorties = [];
        foreach ($mouvements as $m) {
            $cat = $m->categorie ?: 'Autres dépenses';
            $sorties[$cat] = ($sorties[$cat] ?? 0) + (float) $m->montant;
        }

        return ['entrees' => $entrees, 'sorties' => $sorties];
    }

    // ==================== Legacy endpoints pour compatibilité ====================

    public function stats(Request $request): JsonResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        
        $previsions = Prevision::where('annee', $annee)->get();

        $totalRecettesPrevu = $previsions->where('type', 'recette')->sum('montant_prevu');
        $totalDepensesPrevu = $previsions->where('type', 'depense')->sum('montant_prevu');

        // Calculer les réels de l'année
        $totalEntrees = 0;
        $totalSorties = 0;
        for ($m = 1; $m <= 12; $m++) {
            $reelsCaisse = $this->getReelsCaisseMois($annee, $m);
            $reelsBanque = $this->getReelsBanqueMois($annee, $m);
            $totalEntrees += $reelsCaisse['entrees'] + $reelsBanque['entrees'];
            $totalSorties += $reelsCaisse['sorties'] + $reelsBanque['sorties'];
        }

        $tauxRecettes = $totalRecettesPrevu > 0 ? round(($totalEntrees / $totalRecettesPrevu) * 100, 1) : 0;
        $tauxDepenses = $totalDepensesPrevu > 0 ? round(($totalSorties / $totalDepensesPrevu) * 100, 1) : 0;

        $compteurs = [
            'en_cours' => $previsions->where('statut', 'en_cours')->count(),
            'atteint' => $previsions->where('statut', 'atteint')->count(),
            'depasse' => $previsions->where('statut', 'depasse')->count(),
            'non_atteint' => $previsions->where('statut', 'non_atteint')->count(),
        ];

        return response()->json([
            'annee' => $annee,
            'stats' => [
                'recettes' => [
                    'prevu' => $totalRecettesPrevu,
                    'realise' => $totalEntrees,
                ],
                'depenses' => [
                    'prevu' => $totalDepensesPrevu,
                    'realise' => $totalSorties,
                ],
            ],
            'total_prevu' => $totalRecettesPrevu + $totalDepensesPrevu,
            'total_realise' => $totalEntrees + $totalSorties,
            'taux_recettes' => $tauxRecettes,
            'taux_depenses' => $tauxDepenses,
            'taux_global' => $totalRecettesPrevu + $totalDepensesPrevu > 0 
                ? round((($totalEntrees + $totalSorties) / ($totalRecettesPrevu + $totalDepensesPrevu)) * 100, 1) 
                : 0,
            'compteurs' => $compteurs,
            'benefice_annee' => $totalEntrees - $totalSorties,
        ]);
    }
}
