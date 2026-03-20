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
    protected CaisseHorslbvController $horslbv;
    protected CaisseGarageController $garage;

    public function __construct()
    {
        $this->ops = new CaisseOpsController();
        $this->cnv = new CaisseCnvController();
        $this->horslbv = new CaisseHorslbvController();
        $this->garage = new CaisseGarageController();
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

            if (in_array($sourceFilter, ['all', 'HORSLBV']) && $this->horslbv->isAvailable()) {
                $allPrimes = $allPrimes->merge($this->horslbv->fetchPrimes($search));
            }

            // Vérifier décaissements dans FAC
            $allPrimes = $this->attachDecaissementStatus($allPrimes);

            // Filtrage par statut de décaissement
            if ($statut === 'a_decaisser') {
                $allPrimes = $allPrimes->filter(fn($p) => !$p->decaisse && !$p->refusee);
            } elseif ($statut === 'decaisse') {
                $allPrimes = $allPrimes->filter(fn($p) => $p->decaisse);
            } elseif ($statut === 'refusee') {
                $allPrimes = $allPrimes->filter(fn($p) => $p->refusee);
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

            if ($this->horslbv->isAvailable()) {
                $allPrimes = $allPrimes->merge($this->horslbv->fetchStats());
            }

            $refs = $allPrimes->pluck('ref')->toArray();
            $decaisseesRefs = [];
            if (!empty($refs)) {
                $decaisseesRefs = DB::table('mouvements_caisse')
                    ->whereIn('categorie', [CaisseOpsController::categorie(), CaisseCnvController::categorie(), CaisseHorslbvController::categorie()])
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
            'source' => 'nullable|in:OPS,CNV,HORSLBV',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $source = $request->get('source', 'OPS');

        try {
            $handler = match ($source) {
                'CNV' => $this->cnv,
                'HORSLBV' => $this->horslbv,
                default => $this->ops,
            };

            $validationError = $handler->decaisser($request, $primeId);
            if ($validationError) {
                return $validationError;
            }

            $prime = $handler->getPrimeForDecaissement($primeId);
            if (!$prime) {
                return response()->json(['message' => 'Prime non trouvée'], 404);
            }

            $refUnique = match ($source) {
                'CNV' => CaisseCnvController::buildRef($primeId),
                'HORSLBV' => CaisseHorslbvController::buildRef($primeId),
                default => CaisseOpsController::buildRef($primeId),
            };

            $categorie = match ($source) {
                'CNV' => CaisseCnvController::categorie(),
                'HORSLBV' => CaisseHorslbvController::categorie(),
                default => CaisseOpsController::categorie(),
            };

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

    /**
     * Refuser le décaissement d'une prime (OPS ou CNV)
     */
    public function refuser(Request $request, string $primeId): JsonResponse
    {
        return $this->doRefuser($request, $primeId, 'OPS');
    }

    /**
     * Refuser le décaissement d'une prime CNV (appelé depuis route caisse-cnv)
     */
    public function refuserCnv(Request $request, string $primeId): JsonResponse
    {
        return $this->doRefuser($request, $primeId, 'CNV');
    }

    public function doRefuser(Request $request, string $primeId, string $source): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'motif' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reference = match ($source) {
            'CNV' => CaisseCnvController::buildRef($primeId),
            'HORSLBV' => CaisseHorslbvController::buildRef($primeId),
            default => CaisseOpsController::buildRef($primeId),
        };

        // Vérifier si déjà refusée
        if (DB::table('primes_refusees')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cette prime a déjà été refusée'], 422);
        }

        // Vérifier si déjà décaissée
        if (DB::table('mouvements_caisse')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cette prime a déjà été décaissée, impossible de la refuser'], 422);
        }

        try {
            DB::table('primes_refusees')->insert([
                'prime_id' => $primeId,
                'source' => $source,
                'reference' => $reference,
                'motif' => $request->get('motif'),
                'user_id' => $request->user()?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Audit::log('create', 'refus_decaissement', "Refus décaissement prime {$source}: {$primeId}", null);

            return response()->json(['message' => 'Prime refusée avec succès'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du refus',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ── Private helpers ──

    private function attachDecaissementStatus(\Illuminate\Support\Collection $primes): \Illuminate\Support\Collection
    {
        if ($primes->isEmpty()) return $primes;

        $refs = $primes->map(function ($p) {
            return match ($p->source) {
                'CNV' => CaisseCnvController::buildRef($p->id),
                'HORSLBV' => CaisseHorslbvController::buildRef($p->id),
                default => CaisseOpsController::buildRef($p->id),
            };
        })->toArray();

        // Vérifier décaissements
        $mouvements = DB::table('mouvements_caisse')
            ->whereIn('categorie', [CaisseOpsController::categorie(), CaisseCnvController::categorie(), CaisseHorslbvController::categorie()])
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])
            ->keyBy('reference');

        // Vérifier refus
        $refusees = DB::table('primes_refusees')
            ->whereIn('reference', $refs)
            ->pluck('reference')
            ->toArray();

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
