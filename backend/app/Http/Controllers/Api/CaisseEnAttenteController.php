<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Contrôleur orchestrateur pour la Caisse en attente
 * Délègue à CaisseOpsController et CaisseCnvController
 */
class CaisseEnAttenteController extends Controller
{
    protected CaisseOpsController $ops;
    protected CaisseCnvController $cnv;

    public function __construct()
    {
        $this->ops = new CaisseOpsController();
        $this->cnv = new CaisseCnvController();
    }

    /**
     * Liste des primes payées en attente de décaissement (OPS + CNV)
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

            if (in_array($sourceFilter, ['all', 'OPS']) && $this->ops->isAvailable()) {
                $allPrimes = $allPrimes->merge($this->ops->fetchPrimes($search));
            }

            if (in_array($sourceFilter, ['all', 'CNV']) && $this->cnv->isAvailable()) {
                $allPrimes = $allPrimes->merge($this->cnv->fetchPrimes($search));
            }

            // Vérifier décaissements dans FAC
            $allPrimes = $this->attachDecaissementStatus($allPrimes);

            // Filtrage par statut de décaissement
            if ($statut === 'a_decaisser') {
                $allPrimes = $allPrimes->filter(fn($p) => !$p->decaisse);
            } elseif ($statut === 'decaisse') {
                $allPrimes = $allPrimes->filter(fn($p) => $p->decaisse);
            }

            // Tri et pagination
            $allPrimes = $allPrimes->sortByDesc('date_paiement')->values();
            $total = $allPrimes->count();
            $primes = $allPrimes->slice(($page - 1) * $perPage, $perPage)->values();

            return response()->json([
                'data' => $primes,
                'meta' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => $total,
                    'last_page' => max(1, ceil($total / $perPage)),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des primes',
                'error' => $e->getMessage(),
                'data' => [],
                'meta' => ['total' => 0]
            ], 200);
        }
    }

    /**
     * Statistiques de la caisse en attente (OPS + CNV)
     */
    public function stats(): JsonResponse
    {
        try {
            $allPrimes = collect();

            if ($this->ops->isAvailable()) {
                $allPrimes = $allPrimes->merge($this->ops->fetchStats());
            }

            if ($this->cnv->isAvailable()) {
                $allPrimes = $allPrimes->merge($this->cnv->fetchStats());
            }

            $refs = $allPrimes->pluck('ref')->toArray();
            $decaisseesRefs = [];
            if (!empty($refs)) {
                $decaisseesRefs = DB::table('mouvements_caisse')
                    ->whereIn('categorie', [CaisseOpsController::categorie(), CaisseCnvController::categorie()])
                    ->whereIn('reference', $refs)
                    ->pluck('reference')
                    ->toArray();
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
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'total_valide' => 0,
                'nombre_primes' => 0,
                'total_a_decaisser' => 0,
                'deja_decaissees' => 0,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Décaisser une prime (créer sortie de caisse dans FAC)
     */
    public function decaisser(Request $request, string $primeId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mode_paiement' => 'required|in:Espèces,Virement,Chèque,Mobile Money',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'source' => 'nullable|in:OPS,CNV',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $source = $request->get('source', 'OPS');

        try {
            // Déléguer la validation à la source appropriée
            $handler = $source === 'CNV' ? $this->cnv : $this->ops;

            $validationError = $handler->decaisser($request, $primeId);
            if ($validationError) {
                return $validationError;
            }

            $prime = $handler->getPrimeForDecaissement($primeId);
            if (!$prime) {
                return response()->json(['message' => 'Prime non trouvée'], 404);
            }

            $refUnique = $source === 'CNV'
                ? CaisseCnvController::buildRef($primeId)
                : CaisseOpsController::buildRef($primeId);

            $categorie = $source === 'CNV'
                ? CaisseCnvController::categorie()
                : CaisseOpsController::categorie();

            DB::beginTransaction();

            $beneficiaire = $prime->beneficiaire ?? 'N/A';
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            $description = "Prime {$prime->type} - {$beneficiaire}";
            $numeroPaiement = $prime->numero_paiement ?? null;
            if ($numeroPaiement) {
                $description .= " - {$numeroPaiement}";
            }

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => $categorie,
                'montant' => $prime->montant,
                'description' => $description,
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            Audit::log('create', 'decaissement_caisse_attente', "Décaissement prime {$source}: {$prime->montant} - {$beneficiaire}", $mouvement->id);

            DB::commit();

            return response()->json([
                'message' => 'Décaissement validé avec succès',
                'mouvement' => $mouvement,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors du décaissement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── Private helpers ──

    private function attachDecaissementStatus(\Illuminate\Support\Collection $primes): \Illuminate\Support\Collection
    {
        if ($primes->isEmpty()) return $primes;

        $refs = $primes->map(function ($p) {
            return $p->source === 'CNV'
                ? CaisseCnvController::buildRef($p->id)
                : CaisseOpsController::buildRef($p->id);
        })->toArray();

        $mouvements = DB::table('mouvements_caisse')
            ->whereIn('categorie', [CaisseOpsController::categorie(), CaisseCnvController::categorie()])
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])
            ->keyBy('reference');

        return $primes->map(function ($prime) use ($mouvements) {
            $ref = $prime->source === 'CNV'
                ? CaisseCnvController::buildRef($prime->id)
                : CaisseOpsController::buildRef($prime->id);
            $mouvement = $mouvements[$ref] ?? null;
            $prime->decaisse = $mouvement !== null;
            $prime->mouvement_id = $mouvement?->id;
            $prime->date_decaissement = $mouvement?->date;
            $prime->mode_paiement_decaissement = $mouvement?->mode_paiement;
            return $prime;
        });
    }
}
