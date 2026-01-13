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

            $montantEmprunte = $request->montant_emprunte;
            $dureeEnMois = $request->duree_en_mois;
            $tauxInteret = $request->taux_interet;
            
            // Calcul des intérêts simples
            $totalInterets = $montantEmprunte * ($tauxInteret / 100) * ($dureeEnMois / 12);
            $mensualite = ($montantEmprunte + $totalInterets) / $dureeEnMois;
            $numero = $this->generateNumero();

            $credit = CreditBancaire::create([
                'numero' => $numero,
                'banque_id' => $request->banque_id,
                'objet' => $request->objet,
                'montant_emprunte' => $montantEmprunte,
                'taux_interet' => $tauxInteret,
                'total_interets' => $totalInterets,
                'mensualite' => $mensualite,
                'duree_en_mois' => $dureeEnMois,
                'date_debut' => $request->date_debut,
                'date_fin' => date('Y-m-d', strtotime($request->date_debut . " + {$dureeEnMois} months")),
                'notes' => $request->notes,
                'statut' => 'actif',
                'montant_rembourse' => 0,
            ]);

            // Créer les échéances
            for ($i = 1; $i <= $dureeEnMois; $i++) {
                EcheanceCredit::create([
                    'credit_id' => $credit->id,
                    'numero' => $i,
                    'date_echeance' => date('Y-m-d', strtotime($request->date_debut . " + {$i} months")),
                    'montant_capital' => $montantEmprunte / $dureeEnMois,
                    'montant_interet' => $totalInterets / $dureeEnMois,
                    'montant_total' => $mensualite,
                    'montant_paye' => 0,
                    'statut' => 'a_payer',
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
        
        // Stats globales - utilise les vraies colonnes: montant_emprunte, total_interets, montant_rembourse
        $creditsActifs = CreditBancaire::where('statut', 'actif')
            ->orWhere('statut', 'Actif')
            ->get();
        
        // Calculer le total (montant_emprunte + total_interets)
        $totalCreditsActifs = $creditsActifs->sum(function ($c) {
            return $c->montant_emprunte + $c->total_interets;
        });
        
        $totalRembourseTous = $creditsActifs->sum('montant_rembourse');
        
        $resteGlobal = $creditsActifs->sum(function ($c) {
            return ($c->montant_emprunte + $c->total_interets) - $c->montant_rembourse;
        });
        
        $echeancesEnRetard = EcheanceCredit::where('statut', '!=', 'payee')
            ->where('statut', '!=', 'Payée')
            ->where('date_echeance', '<', now())
            ->count();
        
        $totalInterets = $creditsActifs->sum('total_interets');
        
        // Par banque
        $parBanque = CreditBancaire::where(function ($q) {
                $q->where('statut', 'actif')->orWhere('statut', 'Actif');
            })
            ->with('banque')
            ->get()
            ->groupBy('banque_id')
            ->map(function ($credits, $banqueId) {
                $banque = $credits->first()->banque;
                $total = $credits->sum(function ($c) {
                    return $c->montant_emprunte + $c->total_interets;
                });
                $rembourse = $credits->sum('montant_rembourse');
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
            'actif' => CreditBancaire::where('statut', 'actif')->orWhere('statut', 'Actif')->count(),
            'solde' => CreditBancaire::where('statut', 'termine')->orWhere('statut', 'Soldé')->orWhere('statut', 'soldé')->count(),
            'en_defaut' => CreditBancaire::where('statut', 'en_retard')->orWhere('statut', 'En défaut')->count(),
        ];
        
        // Evolution mensuelle
        $evolutionMensuelle = [];
        $moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        for ($mois = 1; $mois <= 12; $mois++) {
            $emprunte = CreditBancaire::whereYear('date_debut', $annee)
                ->whereMonth('date_debut', $mois)
                ->sum('montant_emprunte');
            
            $rembourse = CreditBancaire::whereYear('date_debut', $annee)
                ->whereMonth('date_debut', $mois)
                ->sum('montant_rembourse');
            
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
            ->where('statut', '!=', 'payee')
            ->where('statut', '!=', 'Payée')
            ->where('date_echeance', '>=', now())
            ->orderBy('date_echeance')
            ->limit(10)
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'credit_id' => $e->credit_id,
                    'credit_numero' => $e->credit?->numero,
                    'banque' => $e->credit?->banque?->nom,
                    'numero_echeance' => $e->numero,
                    'date_echeance' => $e->date_echeance?->toDateString(),
                    'montant' => round($e->montant_total ?? $e->montant ?? 0, 2),
                    'statut' => $e->statut,
                ];
            });
        
        // Échéances en retard
        $echeancesRetard = EcheanceCredit::with('credit.banque')
            ->where('statut', '!=', 'payee')
            ->where('statut', '!=', 'Payée')
            ->where('date_echeance', '<', now())
            ->orderBy('date_echeance')
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'credit_id' => $e->credit_id,
                    'credit_numero' => $e->credit?->numero,
                    'banque' => $e->credit?->banque?->nom,
                    'numero_echeance' => $e->numero,
                    'date_echeance' => $e->date_echeance?->toDateString(),
                    'montant' => round($e->montant_total ?? $e->montant ?? 0, 2),
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
        
        // Totaux par statut - utilise les vraies colonnes
        $creditsActifs = CreditBancaire::where('statut', 'actif')->orWhere('statut', 'Actif')->get();
        $creditsSoldes = CreditBancaire::where('statut', 'termine')->orWhere('statut', 'Soldé')->orWhere('statut', 'soldé')->get();
        $creditsDefaut = CreditBancaire::where('statut', 'en_retard')->orWhere('statut', 'En défaut')->get();
        
        $totauxStatut = [
            'actif' => [
                'nombre' => $creditsActifs->count(),
                'montant' => round($creditsActifs->sum(function ($c) {
                    return $c->montant_emprunte + $c->total_interets;
                }), 2),
            ],
            'solde' => [
                'nombre' => $creditsSoldes->count(),
                'montant' => round($creditsSoldes->sum(function ($c) {
                    return $c->montant_emprunte + $c->total_interets;
                }), 2),
            ],
            'en_defaut' => [
                'nombre' => $creditsDefaut->count(),
                'montant' => round($creditsDefaut->sum(function ($c) {
                    return $c->montant_emprunte + $c->total_interets;
                }), 2),
            ],
        ];
        
        // Répartition par banque
        $repartitionBanque = CreditBancaire::with('banque')
            ->get()
            ->groupBy('banque_id')
            ->map(function ($credits, $banqueId) {
                $banque = $credits->first()->banque;
                return [
                    'banque_id' => $banqueId,
                    'banque_nom' => $banque?->nom ?? 'Non spécifiée',
                    'principal' => round($credits->sum('montant_emprunte'), 2),
                    'interets' => round($credits->sum('total_interets'), 2),
                    'total' => round($credits->sum(function ($c) {
                        return $c->montant_emprunte + $c->total_interets;
                    }), 2),
                    'nombre' => $credits->count(),
                ];
            })->values();
        
        // Calendrier des échéances (prochains 6 mois)
        $calendrierEcheances = [];
        for ($i = 0; $i < 6; $i++) {
            $date = now()->addMonths($i);
            $mois = $date->month;
            $an = $date->year;
            
            $echeancesMois = EcheanceCredit::whereYear('date_echeance', $an)
                ->whereMonth('date_echeance', $mois)
                ->where('statut', '!=', 'payee')
                ->where('statut', '!=', 'Payée')
                ->get();
            
            $calendrierEcheances[] = [
                'mois' => $mois,
                'annee' => $an,
                'periode' => $date->format('M Y'),
                'nombre' => $echeancesMois->count(),
                'montant' => round($echeancesMois->sum('montant_total'), 2),
            ];
        }
        
        // Top crédits par montant
        $topCredits = CreditBancaire::with('banque')
            ->where(function ($q) {
                $q->where('statut', 'actif')->orWhere('statut', 'Actif');
            })
            ->get()
            ->sortByDesc(function ($c) {
                return $c->montant_emprunte + $c->total_interets;
            })
            ->take(5)
            ->map(function ($c) {
                $total = $c->montant_emprunte + $c->total_interets;
                $rembourse = $c->montant_rembourse;
                return [
                    'id' => $c->id,
                    'numero' => $c->numero,
                    'banque' => $c->banque?->nom,
                    'objet' => $c->objet,
                    'montant_total' => round($total, 2),
                    'rembourse' => round($rembourse, 2),
                    'reste' => round($total - $rembourse, 2),
                    'taux_remboursement' => $total > 0 ? round(($rembourse / $total) * 100, 1) : 0,
                    'date_fin' => $c->date_fin?->toDateString(),
                ];
            })->values();
        
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
        
        // Calcul du solde initial avant l'année
        $creditsAvant = CreditBancaire::whereYear('date_debut', '<', $annee)->get();
        $soldeRestantCumule = $creditsAvant->sum(function ($c) {
            return ($c->montant_emprunte + $c->total_interets) - $c->montant_rembourse;
        });
        
        $parMois = [];
        for ($mois = 1; $mois <= 12; $mois++) {
            $creditsMois = CreditBancaire::whereYear('date_debut', $annee)
                ->whereMonth('date_debut', $mois)
                ->get();
            
            $emprunte = $creditsMois->sum('montant_emprunte');
            $interets = $creditsMois->sum('total_interets');
            $rembourse = $creditsMois->sum('montant_rembourse');
            
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
        $creditsAnnee = CreditBancaire::whereYear('date_debut', $annee)->get();
        $tousCreditsActifs = CreditBancaire::where(function ($q) {
            $q->where('statut', 'actif')->orWhere('statut', 'Actif');
        })->get();
        
        $totaux = [
            'emprunte' => round($creditsAnnee->sum('montant_emprunte'), 2),
            'rembourse' => round($creditsAnnee->sum('montant_rembourse'), 2),
            'interets' => round($creditsAnnee->sum('total_interets'), 2),
            'reste' => round($tousCreditsActifs->sum(function ($c) {
                return ($c->montant_emprunte + $c->total_interets) - $c->montant_rembourse;
            }), 2),
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
