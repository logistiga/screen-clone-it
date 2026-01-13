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
    public function index(Request $request): JsonResponse
    {
        $query = Prevision::with(['user', 'banque']);

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('source')) {
            $query->where('source', $request->get('source'));
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
            ->paginate($request->get('per_page', 50));

        return response()->json(PrevisionResource::collection($previsions)->response()->getData(true));
    }

    public function store(StorePrevisionRequest $request): JsonResponse
    {
        $exists = Prevision::where('type', $request->type)
            ->where('source', $request->source)
            ->where('categorie', $request->categorie)
            ->where('mois', $request->mois)
            ->where('annee', $request->annee)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Une prévision similaire existe déjà pour cette période'
            ], 422);
        }

        $prevision = Prevision::create([
            'type' => $request->type,
            'source' => $request->source,
            'categorie' => $request->categorie,
            'description' => $request->description,
            'montant_prevu' => $request->montant_prevu,
            'montant_realise' => 0,
            'mois' => $request->mois,
            'annee' => $request->annee,
            'date_prevue' => $request->date_prevue,
            'statut' => 'en_cours',
            'notes' => $request->notes,
            'user_id' => auth()->id(),
            'banque_id' => $request->banque_id,
        ]);

        Audit::log('create', 'prevision', "Prévision créée: {$request->type} - {$request->categorie}", $prevision->id);

        return response()->json(new PrevisionResource($prevision->load(['user', 'banque'])), 201);
    }

    public function show(Prevision $prevision): JsonResponse
    {
        $prevision->load(['user', 'banque']);
        return response()->json(new PrevisionResource($prevision));
    }

    public function update(UpdatePrevisionRequest $request, Prevision $prevision): JsonResponse
    {
        $prevision->update($request->validated());

        // Mettre à jour le statut automatiquement
        $prevision->updateStatut();

        Audit::log('update', 'prevision', "Prévision modifiée", $prevision->id);

        return response()->json(new PrevisionResource($prevision->load(['user', 'banque'])));
    }

    public function destroy(Prevision $prevision): JsonResponse
    {
        Audit::log('delete', 'prevision', "Prévision supprimée: {$prevision->categorie}", $prevision->id);

        $prevision->delete();
        
        return response()->json(['message' => 'Prévision supprimée avec succès']);
    }

    public function updateRealise(Request $request, Prevision $prevision): JsonResponse
    {
        $request->validate([
            'montant' => 'required|numeric|min:0',
            'mode' => 'sometimes|in:ajouter,remplacer',
        ]);

        $mode = $request->get('mode', 'ajouter');
        
        if ($mode === 'remplacer') {
            $prevision->montant_realise = $request->montant;
        } else {
            $prevision->montant_realise += $request->montant;
        }
        
        $prevision->save();
        $prevision->updateStatut();

        return response()->json(new PrevisionResource($prevision->load(['user', 'banque'])));
    }

    public function stats(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));

        // Récupérer les données réelles depuis les mouvements de caisse et paiements
        $reelCaisse = $this->getReelsCaisseAnnee($annee);
        $reelBanque = $this->getReelsBanqueAnnee($annee);

        // Prévisions enregistrées
        $prevuRecettesCaisse = Prevision::where('type', 'recette')
            ->where('source', 'caisse')
            ->where('annee', $annee)
            ->sum('montant_prevu');
        $prevuRecettesBanque = Prevision::where('type', 'recette')
            ->where('source', 'banque')
            ->where('annee', $annee)
            ->sum('montant_prevu');
        $prevuDepensesCaisse = Prevision::where('type', 'depense')
            ->where('source', 'caisse')
            ->where('annee', $annee)
            ->sum('montant_prevu');
        $prevuDepensesBanque = Prevision::where('type', 'depense')
            ->where('source', 'banque')
            ->where('annee', $annee)
            ->sum('montant_prevu');

        // Statistiques globales avec données réelles dynamiques
        $stats = [
            'recettes' => [
                'caisse' => [
                    'prevu' => $prevuRecettesCaisse,
                    'realise' => $reelCaisse['entrees'],
                ],
                'banque' => [
                    'prevu' => $prevuRecettesBanque,
                    'realise' => $reelBanque['entrees'],
                ],
            ],
            'depenses' => [
                'caisse' => [
                    'prevu' => $prevuDepensesCaisse,
                    'realise' => $reelCaisse['sorties'],
                ],
                'banque' => [
                    'prevu' => $prevuDepensesBanque,
                    'realise' => $reelBanque['sorties'],
                ],
            ],
        ];

        // Par mois
        $parMois = Prevision::where('annee', $annee)
            ->selectRaw('mois, type, source, 
                SUM(montant_prevu) as prevu, 
                SUM(montant_realise) as realise')
            ->groupBy('mois', 'type', 'source')
            ->orderBy('mois')
            ->get();

        // Par catégorie
        $parCategorie = Prevision::where('annee', $annee)
            ->selectRaw('categorie, type, source, 
                SUM(montant_prevu) as prevu, 
                SUM(montant_realise) as realise')
            ->groupBy('categorie', 'type', 'source')
            ->get();

        // Taux de réalisation global basé sur les données réelles
        $totalPrevu = $prevuRecettesCaisse + $prevuRecettesBanque + $prevuDepensesCaisse + $prevuDepensesBanque;
        $totalRealise = $reelCaisse['entrees'] + $reelCaisse['sorties'] + $reelBanque['entrees'] + $reelBanque['sorties'];
        $tauxGlobal = $totalPrevu > 0 ? round(($totalRealise / $totalPrevu) * 100, 2) : 0;

        // Compteurs de statut
        $compteurs = [
            'en_cours' => Prevision::where('annee', $annee)->where('statut', 'en_cours')->count(),
            'atteint' => Prevision::where('annee', $annee)->where('statut', 'atteint')->count(),
            'depasse' => Prevision::where('annee', $annee)->where('statut', 'depasse')->count(),
            'non_atteint' => Prevision::where('annee', $annee)->where('statut', 'non_atteint')->count(),
        ];

        return response()->json([
            'annee' => $annee,
            'stats' => $stats,
            'par_mois' => $parMois,
            'par_categorie' => $parCategorie,
            'total_prevu' => $totalPrevu,
            'total_realise' => $totalRealise,
            'taux_global' => $tauxGlobal,
            'compteurs' => $compteurs,
        ]);
    }

    private function getReelsCaisseAnnee(int $annee): array
    {
        $mouvements = MouvementCaisse::whereYear('date', $annee)->get();
        
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

    private function getReelsBanqueAnnee(int $annee): array
    {
        // Paiements reçus = entrées banque
        $paiementsRecus = Paiement::whereYear('date', $annee)->sum('montant');
        
        // Pour les sorties bancaires, on pourrait ajouter d'autres sources
        // comme les remboursements de crédits, virements sortants, etc.

        return [
            'entrees' => (float) $paiementsRecus,
            'sorties' => 0,
        ];
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'recette' => Prevision::getCategoriesRecettes(),
            'depense' => Prevision::getCategoriesDepenses(),
        ]);
    }

    public function comparaison(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        $mois = $request->get('mois');
        $source = $request->get('source'); // caisse ou banque

        $query = Prevision::where('annee', $annee);
        
        if ($mois) {
            $query->where('mois', $mois);
        }
        
        if ($source) {
            $query->where('source', $source);
        }

        $previsions = $query->get();

        // Calculer les réels depuis les mouvements de caisse
        $reelCaisse = $this->getReelsCaisse($annee, $mois);
        $reelBanque = $this->getReelsBanque($annee, $mois);

        $comparaison = [];
        $moisNoms = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];

        for ($m = 1; $m <= 12; $m++) {
            $prevMois = $previsions->where('mois', $m);
            
            $comparaison[] = [
                'mois' => $m,
                'mois_nom' => $moisNoms[$m],
                'recettes' => [
                    'caisse' => [
                        'prevu' => $prevMois->where('type', 'recette')->where('source', 'caisse')->sum('montant_prevu'),
                        'realise' => $reelCaisse[$m]['entrees'] ?? 0,
                    ],
                    'banque' => [
                        'prevu' => $prevMois->where('type', 'recette')->where('source', 'banque')->sum('montant_prevu'),
                        'realise' => $reelBanque[$m]['entrees'] ?? 0,
                    ],
                ],
                'depenses' => [
                    'caisse' => [
                        'prevu' => $prevMois->where('type', 'depense')->where('source', 'caisse')->sum('montant_prevu'),
                        'realise' => $reelCaisse[$m]['sorties'] ?? 0,
                    ],
                    'banque' => [
                        'prevu' => $prevMois->where('type', 'depense')->where('source', 'banque')->sum('montant_prevu'),
                        'realise' => $reelBanque[$m]['sorties'] ?? 0,
                    ],
                ],
            ];
        }

        return response()->json([
            'annee' => $annee,
            'comparaison' => $comparaison,
            'reel_caisse' => $reelCaisse,
            'reel_banque' => $reelBanque,
        ]);
    }

    private function getReelsCaisse(int $annee, ?int $mois = null): array
    {
        $query = MouvementCaisse::whereYear('date', $annee);
        
        if ($mois) {
            $query->whereMonth('date', $mois);
        }

        $mouvements = $query->selectRaw('
            MONTH(date) as mois,
            SUM(CASE WHEN type = "entree" OR type = "Entrée" THEN montant ELSE 0 END) as entrees,
            SUM(CASE WHEN type = "sortie" OR type = "Sortie" THEN montant ELSE 0 END) as sorties
        ')
        ->groupBy('mois')
        ->get()
        ->keyBy('mois');

        $result = [];
        for ($m = 1; $m <= 12; $m++) {
            $result[$m] = [
                'entrees' => $mouvements[$m]->entrees ?? 0,
                'sorties' => $mouvements[$m]->sorties ?? 0,
            ];
        }

        return $result;
    }

    private function getReelsBanque(int $annee, ?int $mois = null): array
    {
        // Paiements reçus (entrées banque) - tous les paiements sont considérés comme bancaires
        $paiementsQuery = Paiement::whereYear('date', $annee);
        
        if ($mois) {
            $paiementsQuery->whereMonth('date', $mois);
        }

        $paiements = $paiementsQuery->selectRaw('
            MONTH(date) as mois,
            SUM(montant) as total
        ')
        ->groupBy('mois')
        ->get()
        ->keyBy('mois');

        $result = [];
        for ($m = 1; $m <= 12; $m++) {
            $result[$m] = [
                'entrees' => $paiements[$m]->total ?? 0,
                'sorties' => 0, // À compléter avec les virements sortants si nécessaire
            ];
        }

        return $result;
    }

    public function syncRealise(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        $mois = $request->get('mois', date('n'));

        // Synchroniser les montants réels depuis les mouvements de caisse
        $reelCaisse = $this->getReelsCaisse($annee, $mois);
        
        // Mettre à jour les prévisions de recettes caisse
        $previsionRecettesCaisse = Prevision::where('annee', $annee)
            ->where('mois', $mois)
            ->where('type', 'recette')
            ->where('source', 'caisse')
            ->first();

        if ($previsionRecettesCaisse) {
            $previsionRecettesCaisse->update([
                'montant_realise' => $reelCaisse[$mois]['entrees']
            ]);
            $previsionRecettesCaisse->updateStatut();
        }

        // Mettre à jour les prévisions de dépenses caisse
        $previsionDepensesCaisse = Prevision::where('annee', $annee)
            ->where('mois', $mois)
            ->where('type', 'depense')
            ->where('source', 'caisse')
            ->first();

        if ($previsionDepensesCaisse) {
            $previsionDepensesCaisse->update([
                'montant_realise' => $reelCaisse[$mois]['sorties']
            ]);
            $previsionDepensesCaisse->updateStatut();
        }

        return response()->json([
            'message' => 'Synchronisation effectuée',
            'mois' => $mois,
            'annee' => $annee,
            'reel_caisse' => $reelCaisse[$mois],
        ]);
    }
}
