<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditBancaire;
use App\Models\EcheanceCredit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Stats, Dashboard et Comparaison des crédits bancaires
 */
class CreditBancaireStatsController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $annee = $request->get('annee', date('Y'));
        
        $creditsActifs = CreditBancaire::where('statut', 'actif')
            ->orWhere('statut', 'Actif')
            ->get();
        
        $totalCreditsActifs = $creditsActifs->sum(fn($c) => $c->montant_emprunte + $c->total_interets);
        $totalRembourseTous = $creditsActifs->sum('montant_rembourse');
        
        $resteGlobal = $creditsActifs->sum(fn($c) => ($c->montant_emprunte + $c->total_interets) - $c->montant_rembourse);
        
        $echeancesEnRetard = EcheanceCredit::where('statut', '!=', 'payee')
            ->where('statut', '!=', 'Payée')
            ->where('date_echeance', '<', now())
            ->count();
        
        $totalInterets = $creditsActifs->sum('total_interets');
        
        $parBanque = CreditBancaire::where(function ($q) {
                $q->where('statut', 'actif')->orWhere('statut', 'Actif');
            })
            ->with('banque')
            ->get()
            ->groupBy('banque_id')
            ->map(function ($credits, $banqueId) {
                $banque = $credits->first()->banque;
                $total = $credits->sum(fn($c) => $c->montant_emprunte + $c->total_interets);
                $rembourse = $credits->sum('montant_rembourse');
                return [
                    'banque_id' => $banqueId,
                    'banque_nom' => $banque?->nom ?? 'Non spécifiée',
                    'total' => round($total, 2),
                    'nombre' => $credits->count(),
                    'rembourse' => round($rembourse, 2),
                ];
            })->values();
        
        $parStatut = [
            'actif' => CreditBancaire::where('statut', 'actif')->orWhere('statut', 'Actif')->count(),
            'solde' => CreditBancaire::where('statut', 'termine')->orWhere('statut', 'Soldé')->orWhere('statut', 'soldé')->count(),
            'en_defaut' => CreditBancaire::where('statut', 'en_retard')->orWhere('statut', 'En défaut')->count(),
        ];
        
        $evolutionMensuelle = [];
        $moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        for ($mois = 1; $mois <= 12; $mois++) {
            $emprunte = CreditBancaire::whereYear('date_debut', $annee)->whereMonth('date_debut', $mois)->sum('montant_emprunte');
            $rembourse = CreditBancaire::whereYear('date_debut', $annee)->whereMonth('date_debut', $mois)->sum('montant_rembourse');
            
            $evolutionMensuelle[] = [
                'mois' => $mois,
                'mois_nom' => $moisNoms[$mois],
                'emprunte' => round($emprunte, 2),
                'rembourse' => round($rembourse, 2),
                'solde' => round($emprunte - $rembourse, 2),
            ];
        }
        
        $prochainesEcheances = EcheanceCredit::with('credit.banque')
            ->where('statut', '!=', 'payee')
            ->where('statut', '!=', 'Payée')
            ->where('date_echeance', '>=', now())
            ->orderBy('date_echeance')
            ->limit(10)
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'credit_id' => $e->credit_id,
                'credit_numero' => $e->credit?->numero,
                'banque' => $e->credit?->banque?->nom,
                'numero_echeance' => $e->numero,
                'date_echeance' => $e->date_echeance?->toDateString(),
                'montant' => round($e->montant_total ?? $e->montant ?? 0, 2),
                'statut' => $e->statut,
            ]);
        
        $echeancesRetard = EcheanceCredit::with('credit.banque')
            ->where('statut', '!=', 'payee')
            ->where('statut', '!=', 'Payée')
            ->where('date_echeance', '<', now())
            ->orderBy('date_echeance')
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'credit_id' => $e->credit_id,
                'credit_numero' => $e->credit?->numero,
                'banque' => $e->credit?->banque?->nom,
                'numero_echeance' => $e->numero,
                'date_echeance' => $e->date_echeance?->toDateString(),
                'montant' => round($e->montant_total ?? $e->montant ?? 0, 2),
                'jours_retard' => now()->diffInDays($e->date_echeance),
                'statut' => 'En retard',
            ]);
        
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
        
        $creditsActifs = CreditBancaire::where('statut', 'actif')->orWhere('statut', 'Actif')->get();
        $creditsSoldes = CreditBancaire::where('statut', 'termine')->orWhere('statut', 'Soldé')->orWhere('statut', 'soldé')->get();
        $creditsDefaut = CreditBancaire::where('statut', 'en_retard')->orWhere('statut', 'En défaut')->get();
        
        $totauxStatut = [
            'actif' => [
                'nombre' => $creditsActifs->count(),
                'montant' => round($creditsActifs->sum(fn($c) => $c->montant_emprunte + $c->total_interets), 2),
            ],
            'solde' => [
                'nombre' => $creditsSoldes->count(),
                'montant' => round($creditsSoldes->sum(fn($c) => $c->montant_emprunte + $c->total_interets), 2),
            ],
            'en_defaut' => [
                'nombre' => $creditsDefaut->count(),
                'montant' => round($creditsDefaut->sum(fn($c) => $c->montant_emprunte + $c->total_interets), 2),
            ],
        ];
        
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
                    'total' => round($credits->sum(fn($c) => $c->montant_emprunte + $c->total_interets), 2),
                    'nombre' => $credits->count(),
                ];
            })->values();
        
        $calendrierEcheances = [];
        for ($i = 0; $i < 6; $i++) {
            $date = now()->addMonths($i);
            $echeancesMois = EcheanceCredit::whereYear('date_echeance', $date->year)
                ->whereMonth('date_echeance', $date->month)
                ->where('statut', '!=', 'payee')
                ->where('statut', '!=', 'Payée')
                ->get();
            
            $calendrierEcheances[] = [
                'mois' => $date->month,
                'annee' => $date->year,
                'periode' => $date->format('M Y'),
                'nombre' => $echeancesMois->count(),
                'montant' => round($echeancesMois->sum('montant_total'), 2),
            ];
        }
        
        $topCredits = CreditBancaire::with('banque')
            ->where(function ($q) {
                $q->where('statut', 'actif')->orWhere('statut', 'Actif');
            })
            ->get()
            ->sortByDesc(fn($c) => $c->montant_emprunte + $c->total_interets)
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
        
        $creditsAvant = CreditBancaire::whereYear('date_debut', '<', $annee)->get();
        $soldeRestantCumule = $creditsAvant->sum(fn($c) => ($c->montant_emprunte + $c->total_interets) - $c->montant_rembourse);
        
        $parMois = [];
        for ($mois = 1; $mois <= 12; $mois++) {
            $creditsMois = CreditBancaire::whereYear('date_debut', $annee)->whereMonth('date_debut', $mois)->get();
            
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
        
        $creditsAnnee = CreditBancaire::whereYear('date_debut', $annee)->get();
        $tousCreditsActifs = CreditBancaire::where(function ($q) {
            $q->where('statut', 'actif')->orWhere('statut', 'Actif');
        })->get();
        
        $totaux = [
            'emprunte' => round($creditsAnnee->sum('montant_emprunte'), 2),
            'rembourse' => round($creditsAnnee->sum('montant_rembourse'), 2),
            'interets' => round($creditsAnnee->sum('total_interets'), 2),
            'reste' => round($tousCreditsActifs->sum(fn($c) => ($c->montant_emprunte + $c->total_interets) - $c->montant_rembourse), 2),
        ];
        
        return response()->json([
            'annee' => (int) $annee,
            'par_mois' => $parMois,
            'totaux' => $totaux,
        ]);
    }
}
