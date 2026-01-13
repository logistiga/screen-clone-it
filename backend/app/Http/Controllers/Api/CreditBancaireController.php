<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCreditBancaireRequest;
use App\Http\Requests\RembourserCreditRequest;
use App\Http\Resources\CreditBancaireResource;
use App\Http\Resources\EcheanceCreditResource;
use App\Http\Resources\RemboursementCreditResource;
use App\Http\Resources\DocumentCreditResource;
use App\Models\CreditBancaire;
use App\Models\EcheanceCredit;
use App\Models\RemboursementCredit;
use App\Models\DocumentCredit;
use App\Models\ModificationCredit;
use App\Models\MouvementCaisse;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CreditBancaireController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CreditBancaire::with(['banque', 'echeances', 'remboursements']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhere('objet', 'like', "%{$search}%")
                  ->orWhereHas('banque', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->has('banque_id')) {
            $query->where('banque_id', $request->get('banque_id'));
        }

        $credits = $query->orderBy('date_debut', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(CreditBancaireResource::collection($credits)->response()->getData(true));
    }

    public function store(StoreCreditBancaireRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $montantInteret = $request->montant_principal * ($request->taux_interet / 100) * ($request->duree_mois / 12);
            $montantTotal = $request->montant_principal + $montantInteret;
            $numero = $this->generateNumero();

            $credit = CreditBancaire::create([
                'numero' => $numero,
                'banque_id' => $request->banque_id,
                'objet' => $request->objet,
                'montant_principal' => $request->montant_principal,
                'taux_interet' => $request->taux_interet,
                'montant_interet' => $montantInteret,
                'montant_total' => $montantTotal,
                'duree_mois' => $request->duree_mois,
                'date_debut' => $request->date_debut,
                'date_fin' => date('Y-m-d', strtotime($request->date_debut . " + {$request->duree_mois} months")),
                'notes' => $request->notes,
                'statut' => 'Actif',
            ]);

            $mensualite = $montantTotal / $request->duree_mois;
            for ($i = 1; $i <= $request->duree_mois; $i++) {
                EcheanceCredit::create([
                    'credit_bancaire_id' => $credit->id,
                    'numero_echeance' => $i,
                    'date_echeance' => date('Y-m-d', strtotime($request->date_debut . " + {$i} months")),
                    'montant' => $mensualite,
                    'statut' => 'En attente',
                ]);
            }

            Audit::log('create', 'credit', "Crédit créé: {$credit->numero}", $credit->id);

            DB::commit();

            return response()->json(new CreditBancaireResource($credit->load(['banque', 'echeances'])), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(CreditBancaire $creditBancaire): JsonResponse
    {
        $creditBancaire->load(['banque', 'echeances', 'remboursements', 'documents', 'modifications']);
        
        return response()->json(new CreditBancaireResource($creditBancaire));
    }

    public function update(Request $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'objet' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string',
            'statut' => 'sometimes|in:Actif,Soldé,En défaut',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->has('objet') || $request->has('notes')) {
            ModificationCredit::create([
                'credit_bancaire_id' => $creditBancaire->id,
                'type_modification' => 'Modification informations',
                'ancien_valeur' => json_encode($creditBancaire->only(['objet', 'notes'])),
                'nouveau_valeur' => json_encode($request->only(['objet', 'notes'])),
                'user_id' => auth()->id(),
            ]);
        }

        $creditBancaire->update($request->only(['objet', 'notes', 'statut']));

        Audit::log('update', 'credit', "Crédit modifié: {$creditBancaire->numero}", $creditBancaire->id);

        return response()->json(new CreditBancaireResource($creditBancaire->load(['banque', 'echeances'])));
    }

    public function destroy(CreditBancaire $creditBancaire): JsonResponse
    {
        if ($creditBancaire->remboursements()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer un crédit avec des remboursements'
            ], 422);
        }

        Audit::log('delete', 'credit', "Crédit supprimé: {$creditBancaire->numero}", $creditBancaire->id);

        $creditBancaire->echeances()->delete();
        $creditBancaire->documents()->delete();
        $creditBancaire->delete();

        return response()->json(['message' => 'Crédit supprimé avec succès']);
    }

    public function rembourser(RembourserCreditRequest $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $montantRembourse = $creditBancaire->remboursements()->sum('montant');
        $resteAPayer = $creditBancaire->montant_total - $montantRembourse;

        if ($request->montant > $resteAPayer) {
            return response()->json([
                'message' => 'Le montant dépasse le reste à payer',
                'reste_a_payer' => $resteAPayer
            ], 422);
        }

        try {
            DB::beginTransaction();

            $remboursement = RemboursementCredit::create([
                'credit_bancaire_id' => $creditBancaire->id,
                'echeance_id' => $request->echeance_id,
                'montant' => $request->montant,
                'mode_paiement' => $request->mode_paiement,
                'reference' => $request->reference,
                'date_remboursement' => now(),
                'notes' => $request->notes,
                'user_id' => auth()->id(),
            ]);

            if ($request->mode_paiement === 'Espèces') {
                MouvementCaisse::create([
                    'type' => 'Sortie',
                    'categorie' => 'Remboursement crédit',
                    'montant' => $request->montant,
                    'description' => "Remboursement crédit {$creditBancaire->numero}",
                    'reference' => $remboursement->id,
                    'date_mouvement' => now(),
                    'user_id' => auth()->id(),
                ]);
            }

            if ($request->echeance_id) {
                $echeance = EcheanceCredit::find($request->echeance_id);
                $echeance->update(['statut' => 'Payée', 'date_paiement' => now()]);
            }

            $nouveauMontantRembourse = $montantRembourse + $request->montant;
            if ($nouveauMontantRembourse >= $creditBancaire->montant_total) {
                $creditBancaire->update(['statut' => 'Soldé']);
            }

            Audit::log('create', 'remboursement', "Remboursement: {$request->montant} pour crédit {$creditBancaire->numero}", $remboursement->id);

            DB::commit();

            return response()->json(new RemboursementCreditResource($remboursement), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors du remboursement', 'error' => $e->getMessage()], 500);
        }
    }

    public function echeances(CreditBancaire $creditBancaire): JsonResponse
    {
        $echeances = $creditBancaire->echeances()
            ->with('remboursements')
            ->orderBy('numero_echeance')
            ->get();

        return response()->json(EcheanceCreditResource::collection($echeances));
    }

    public function uploadDocument(Request $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fichier' => 'required|file|max:10240',
            'type' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('fichier')->store('credits/' . $creditBancaire->id, 'public');

        $document = DocumentCredit::create([
            'credit_bancaire_id' => $creditBancaire->id,
            'type' => $request->type,
            'nom_fichier' => $request->file('fichier')->getClientOriginalName(),
            'chemin' => $path,
            'description' => $request->description,
            'user_id' => auth()->id(),
        ]);

        return response()->json(new DocumentCreditResource($document), 201);
    }

    public function stats(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        
        // Stats globales
        $creditsActifs = CreditBancaire::where('statut', 'Actif')->get();
        $totalCreditsActifs = $creditsActifs->sum('montant_total');
        $totalRembourse = RemboursementCredit::whereYear('date_remboursement', $annee)->sum('montant');
        $totalRembourseTous = RemboursementCredit::sum('montant');
        
        $resteGlobal = $totalCreditsActifs - $creditsActifs->sum(function ($c) {
            return $c->remboursements()->sum('montant');
        });
        
        $echeancesEnRetard = EcheanceCredit::where('statut', '!=', 'Payée')
            ->where('date_echeance', '<', now())
            ->count();
        
        $totalInterets = $creditsActifs->sum('montant_interet');
        
        // Par banque
        $parBanque = CreditBancaire::where('statut', 'Actif')
            ->with('banque')
            ->get()
            ->groupBy('banque_id')
            ->map(function ($credits, $banqueId) {
                $banque = $credits->first()->banque;
                $total = $credits->sum('montant_total');
                $rembourse = $credits->sum(function ($c) {
                    return $c->remboursements()->sum('montant');
                });
                return [
                    'banque_id' => $banqueId,
                    'banque_nom' => $banque?->nom ?? 'Non spécifiée',
                    'total' => round($total, 2),
                    'nombre' => $credits->count(),
                    'rembourse' => round($rembourse, 2),
                ];
            })->values();
        
        // Par statut
        $parStatut = [
            'actif' => CreditBancaire::where('statut', 'Actif')->count(),
            'solde' => CreditBancaire::where('statut', 'Soldé')->count(),
            'en_defaut' => CreditBancaire::where('statut', 'En défaut')->count(),
        ];
        
        // Evolution mensuelle
        $evolutionMensuelle = [];
        $moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        for ($mois = 1; $mois <= 12; $mois++) {
            $emprunte = CreditBancaire::whereYear('date_debut', $annee)
                ->whereMonth('date_debut', $mois)
                ->sum('montant_principal');
            
            $rembourse = RemboursementCredit::whereYear('date_remboursement', $annee)
                ->whereMonth('date_remboursement', $mois)
                ->sum('montant');
            
            $evolutionMensuelle[] = [
                'mois' => $mois,
                'mois_nom' => $moisNoms[$mois],
                'emprunte' => round($emprunte, 2),
                'rembourse' => round($rembourse, 2),
                'solde' => round($emprunte - $rembourse, 2),
            ];
        }
        
        // Prochaines échéances
        $prochainesEcheances = EcheanceCredit::with('credit.banque')
            ->where('statut', '!=', 'Payée')
            ->where('date_echeance', '>=', now())
            ->orderBy('date_echeance')
            ->limit(10)
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'credit_id' => $e->credit_bancaire_id,
                    'credit_numero' => $e->credit?->numero,
                    'banque' => $e->credit?->banque?->nom,
                    'numero_echeance' => $e->numero_echeance,
                    'date_echeance' => $e->date_echeance?->toDateString(),
                    'montant' => round($e->montant, 2),
                    'statut' => $e->statut,
                ];
            });
        
        // Échéances en retard
        $echeancesRetard = EcheanceCredit::with('credit.banque')
            ->where('statut', '!=', 'Payée')
            ->where('date_echeance', '<', now())
            ->orderBy('date_echeance')
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'credit_id' => $e->credit_bancaire_id,
                    'credit_numero' => $e->credit?->numero,
                    'banque' => $e->credit?->banque?->nom,
                    'numero_echeance' => $e->numero_echeance,
                    'date_echeance' => $e->date_echeance?->toDateString(),
                    'montant' => round($e->montant, 2),
                    'jours_retard' => now()->diffInDays($e->date_echeance),
                    'statut' => 'En retard',
                ];
            });
        
        $tauxRemboursement = $totalCreditsActifs > 0 
            ? ($totalRembourseTous / $totalCreditsActifs) * 100 
            : 0;

        return response()->json([
            'total_credits_actifs' => round($totalCreditsActifs, 2),
            'total_rembourse' => round($totalRembourseTous, 2),
            'reste_global' => round($resteGlobal, 2),
            'echeances_en_retard' => $echeancesEnRetard,
            'nombre_credits_actifs' => $creditsActifs->count(),
            'total_interets' => round($totalInterets, 2),
            'taux_remboursement_global' => round($tauxRemboursement, 1),
            'par_banque' => $parBanque,
            'par_statut' => $parStatut,
            'evolution_mensuelle' => $evolutionMensuelle,
            'prochaines_echeances' => $prochainesEcheances,
            'echeances_retard' => $echeancesRetard,
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        
        // Totaux par statut
        $totauxStatut = [
            'actif' => [
                'nombre' => CreditBancaire::where('statut', 'Actif')->count(),
                'montant' => round(CreditBancaire::where('statut', 'Actif')->sum('montant_total'), 2),
            ],
            'solde' => [
                'nombre' => CreditBancaire::where('statut', 'Soldé')->count(),
                'montant' => round(CreditBancaire::where('statut', 'Soldé')->sum('montant_total'), 2),
            ],
            'en_defaut' => [
                'nombre' => CreditBancaire::where('statut', 'En défaut')->count(),
                'montant' => round(CreditBancaire::where('statut', 'En défaut')->sum('montant_total'), 2),
            ],
        ];
        
        // Répartition par banque
        $repartitionBanque = CreditBancaire::with('banque')
            ->selectRaw('banque_id, SUM(montant_principal) as principal, SUM(montant_interet) as interets, SUM(montant_total) as total, COUNT(*) as nombre')
            ->groupBy('banque_id')
            ->get()
            ->map(function ($item) {
                return [
                    'banque_id' => $item->banque_id,
                    'banque_nom' => $item->banque?->nom ?? 'Non spécifiée',
                    'principal' => round($item->principal, 2),
                    'interets' => round($item->interets, 2),
                    'total' => round($item->total, 2),
                    'nombre' => $item->nombre,
                ];
            });
        
        // Calendrier des échéances (prochains 6 mois)
        $calendrierEcheances = [];
        for ($i = 0; $i < 6; $i++) {
            $date = now()->addMonths($i);
            $mois = $date->month;
            $an = $date->year;
            
            $echeancesMois = EcheanceCredit::whereYear('date_echeance', $an)
                ->whereMonth('date_echeance', $mois)
                ->where('statut', '!=', 'Payée')
                ->get();
            
            $calendrierEcheances[] = [
                'mois' => $mois,
                'annee' => $an,
                'periode' => $date->format('M Y'),
                'nombre' => $echeancesMois->count(),
                'montant' => round($echeancesMois->sum('montant'), 2),
            ];
        }
        
        // Top crédits par montant
        $topCredits = CreditBancaire::with('banque')
            ->where('statut', 'Actif')
            ->orderByDesc('montant_total')
            ->limit(5)
            ->get()
            ->map(function ($c) {
                $rembourse = $c->remboursements()->sum('montant');
                return [
                    'id' => $c->id,
                    'numero' => $c->numero,
                    'banque' => $c->banque?->nom,
                    'objet' => $c->objet,
                    'montant_total' => round($c->montant_total, 2),
                    'rembourse' => round($rembourse, 2),
                    'reste' => round($c->montant_total - $rembourse, 2),
                    'taux_remboursement' => $c->montant_total > 0 ? round(($rembourse / $c->montant_total) * 100, 1) : 0,
                    'date_fin' => $c->date_fin,
                ];
            });
        
        return response()->json([
            'totaux_statut' => $totauxStatut,
            'repartition_banque' => $repartitionBanque,
            'calendrier_echeances' => $calendrierEcheances,
            'top_credits' => $topCredits,
        ]);
    }

    public function comparaison(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        
        $moisNoms = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        
        $parMois = [];
        $soldeRestantCumule = CreditBancaire::whereYear('date_debut', '<', $annee)->sum('montant_total')
            - RemboursementCredit::whereYear('date_remboursement', '<', $annee)->sum('montant');
        
        for ($mois = 1; $mois <= 12; $mois++) {
            $emprunte = CreditBancaire::whereYear('date_debut', $annee)
                ->whereMonth('date_debut', $mois)
                ->sum('montant_principal');
            
            $interets = CreditBancaire::whereYear('date_debut', $annee)
                ->whereMonth('date_debut', $mois)
                ->sum('montant_interet');
            
            $rembourse = RemboursementCredit::whereYear('date_remboursement', $annee)
                ->whereMonth('date_remboursement', $mois)
                ->sum('montant');
            
            $soldeRestantCumule += $emprunte + $interets - $rembourse;
            
            $parMois[] = [
                'mois' => $mois,
                'mois_nom' => $moisNoms[$mois],
                'emprunte' => round($emprunte, 2),
                'rembourse' => round($rembourse, 2),
                'solde_restant' => round(max(0, $soldeRestantCumule), 2),
                'interets' => round($interets, 2),
            ];
        }
        
        // Totaux annuels
        $totaux = [
            'emprunte' => round(CreditBancaire::whereYear('date_debut', $annee)->sum('montant_principal'), 2),
            'rembourse' => round(RemboursementCredit::whereYear('date_remboursement', $annee)->sum('montant'), 2),
            'interets' => round(CreditBancaire::whereYear('date_debut', $annee)->sum('montant_interet'), 2),
            'reste' => round(CreditBancaire::where('statut', 'Actif')->sum('montant_total') 
                - RemboursementCredit::sum('montant'), 2),
        ];
        
        return response()->json([
            'annee' => (int) $annee,
            'par_mois' => $parMois,
            'totaux' => $totaux,
        ]);
    }

    private function generateNumero(): string
    {
        $year = date('Y');
        $lastCredit = CreditBancaire::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $lastCredit ? (intval(substr($lastCredit->numero, -4)) + 1) : 1;
        return sprintf('CRD-%s-%04d', $year, $nextNumber);
    }
}
