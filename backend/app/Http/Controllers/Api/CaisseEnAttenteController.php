<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Contrôleur orchestrateur pour la Caisse en attente
 * Liste/stats: ici. Actions (décaisser/refuser): CaisseEnAttenteActionsController
 */
class CaisseEnAttenteController extends Controller
{
    protected CaisseOpsController $ops;
    protected CaisseCnvController $cnv;
    protected CaisseHorslbvController $horslbv;
    protected CaisseGarageController $garage;
    protected CaisseEnAttenteActionsController $actions;

    public function __construct()
    {
        $this->ops = new CaisseOpsController();
        $this->cnv = new CaisseCnvController();
        $this->horslbv = new CaisseHorslbvController();
        $this->garage = new CaisseGarageController();
        $this->actions = new CaisseEnAttenteActionsController();
    }

    /**
     * Liste des primes payées en attente de décaissement (OPS + CNV + HORSLBV)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $page = $request->get('page', 1);
            $search = $request->get('search');
            $statut = $request->get('statut', 'all');
            $sourceFilter = $request->get('source', 'all');

            $allPrimes = collect();
            $sourceErrors = [];

            if (in_array($sourceFilter, ['all', 'OPS']) && $this->ops->isAvailable()) {
                try { $allPrimes = $allPrimes->merge($this->ops->fetchPrimes($search)); }
                catch (\Throwable $e) { $sourceErrors['OPS'] = $e->getMessage(); }
            }

            if (in_array($sourceFilter, ['all', 'CNV']) && $this->cnv->isAvailable()) {
                try { $allPrimes = $allPrimes->merge($this->cnv->fetchPrimes($search)); }
                catch (\Throwable $e) { $sourceErrors['CNV'] = $e->getMessage(); }
            }

            if (in_array($sourceFilter, ['all', 'HORSLBV']) && $this->horslbv->isAvailable()) {
                try { $allPrimes = $allPrimes->merge($this->horslbv->fetchPrimes($search)); }
                catch (\Throwable $e) { $sourceErrors['HORSLBV'] = $e->getMessage(); }
            }

            $allPrimes = $this->attachDecaissementStatus($allPrimes);

            if ($statut === 'a_decaisser') {
                $allPrimes = $allPrimes->filter(fn($p) => !$p->decaisse && !$p->refusee);
            } elseif ($statut === 'decaisse') {
                $allPrimes = $allPrimes->filter(fn($p) => $p->decaisse);
            } elseif ($statut === 'refusee') {
                $allPrimes = $allPrimes->filter(fn($p) => $p->refusee);
            }

            $allPrimes = $allPrimes->sortByDesc('date_paiement')->values();
            $total = $allPrimes->count();
            $primes = $allPrimes->slice(($page - 1) * $perPage, $perPage)->values();

            return response()->json([
                'data' => $primes,
                'meta' => [
                    'current_page' => (int) $page, 'per_page' => (int) $perPage,
                    'total' => $total, 'last_page' => max(1, ceil($total / $perPage)),
                ],
                'source_errors' => (object) $sourceErrors,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des primes',
                'error' => $e->getMessage(), 'data' => [], 'meta' => ['total' => 0]
            ], 200);
        }
    }

    /**
     * Statistiques de la caisse en attente (OPS + CNV + HORSLBV)
     */
    public function stats(): JsonResponse
    {
        try {
            $allPrimes = collect();
            $sourceErrors = [];

            if ($this->ops->isAvailable()) {
                try { $allPrimes = $allPrimes->merge($this->ops->fetchStats()); }
                catch (\Throwable $e) { $sourceErrors['OPS'] = $e->getMessage(); }
            }
            if ($this->cnv->isAvailable()) {
                try { $allPrimes = $allPrimes->merge($this->cnv->fetchStats()); }
                catch (\Throwable $e) { $sourceErrors['CNV'] = $e->getMessage(); }
            }
            if ($this->horslbv->isAvailable()) {
                try { $allPrimes = $allPrimes->merge($this->horslbv->fetchStats()); }
                catch (\Throwable $e) { $sourceErrors['HORSLBV'] = $e->getMessage(); }
            }

            $refs = $allPrimes->pluck('ref')->toArray();
            $decaisseesRefs = [];
            if (!empty($refs)) {
                $decaisseesRefs = DB::table('mouvements_caisse')
                    ->whereIn('categorie', [CaisseOpsController::categorie(), CaisseCnvController::categorie(), CaisseHorslbvController::categorie()])
                    ->whereIn('reference', $refs)->pluck('reference')->toArray();
            }

            $aDecaisser = $allPrimes->filter(fn($p) => !in_array($p->ref, $decaisseesRefs));
            $dejaDecaissees = $allPrimes->filter(fn($p) => in_array($p->ref, $decaisseesRefs));

            return response()->json([
                'total_valide' => $allPrimes->sum('montant'),
                'nombre_primes' => $allPrimes->count(),
                'total_a_decaisser' => $aDecaisser->sum('montant'),
                'nombre_a_decaisser' => $aDecaisser->count(),
                'deja_decaissees' => $dejaDecaissees->count(),
                'total_decaisse' => $dejaDecaissees->sum('montant'),
                'source_errors' => (object) $sourceErrors,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'total_valide' => 0, 'nombre_primes' => 0, 'total_a_decaisser' => 0,
                'nombre_a_decaisser' => 0, 'deja_decaissees' => 0, 'total_decaisse' => 0,
                'error' => $e->getMessage(),
            ]);
        }
    }

    // ── Actions déléguées ──

    public function decaisser(Request $request, string $primeId): JsonResponse
    {
        return $this->actions->decaisser($request, $primeId);
    }

    public function refuser(Request $request, string $primeId): JsonResponse
    {
        return $this->actions->refuser($request, $primeId);
    }

    public function refuserCnv(Request $request, string $primeId): JsonResponse
    {
        return $this->actions->refuserCnv($request, $primeId);
    }

    public function doRefuser(Request $request, string $primeId, string $source): JsonResponse
    {
        return $this->actions->doRefuser($request, $primeId, $source);
    }

    // ── Private helpers ──

    private function attachDecaissementStatus(\Illuminate\Support\Collection $primes): \Illuminate\Support\Collection
    {
        if ($primes->isEmpty()) return $primes;

        $refs = $primes->map(fn($p) => match ($p->source) {
            'CNV' => CaisseCnvController::buildRef($p->id),
            'HORSLBV' => CaisseHorslbvController::buildRef($p->id),
            default => CaisseOpsController::buildRef($p->id),
        })->toArray();

        $mouvements = DB::table('mouvements_caisse')
            ->whereIn('categorie', [CaisseOpsController::categorie(), CaisseCnvController::categorie(), CaisseHorslbvController::categorie()])
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])->keyBy('reference');

        $refusees = DB::table('primes_refusees')->whereIn('reference', $refs)->pluck('reference')->toArray();

        return $primes->map(function ($prime) use ($mouvements, $refusees) {
            $ref = match ($prime->source) {
                'CNV' => CaisseCnvController::buildRef($prime->id),
                'HORSLBV' => CaisseHorslbvController::buildRef($prime->id),
                default => CaisseOpsController::buildRef($prime->id),
            };
            $mouvement = $mouvements[$ref] ?? null;
            $prime->decaisse = $mouvement !== null;
            $prime->mouvement_id = $mouvement?->id;
            $prime->date_decaissement = $mouvement?->date;
            $prime->mode_paiement_decaissement = $mouvement?->mode_paiement;
            $prime->refusee = in_array($ref, $refusees);
            return $prime;
        });
    }
}
