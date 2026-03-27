<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

/**
 * Gère les primes Garage (prime_mecaniciens)
 */
class CaisseGaragePrimesController extends Controller
{
    use CaisseGarageHelpersTrait;

    /**
     * Stats des primes garage
     */
    public function primesStats(): JsonResponse
    {
        try {
            $items = $this->fetchGaragePrimes();
            $items = $this->attachPrimeDecaissementStatus($items);

            $aDecaisser = $items->filter(fn($i) => !$i->decaisse && !$i->refusee);
            $decaissees = $items->filter(fn($i) => $i->decaisse);

            return response()->json([
                'total_valide' => $items->sum('montant'),
                'nombre_primes' => $items->count(),
                'total_a_decaisser' => $aDecaisser->sum('montant'),
                'nombre_a_decaisser' => $aDecaisser->count(),
                'deja_decaissees' => $decaissees->count(),
                'total_decaisse' => $decaissees->sum('montant'),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'total_valide' => 0, 'nombre_primes' => 0,
                'total_a_decaisser' => 0, 'nombre_a_decaisser' => 0,
                'deja_decaissees' => 0, 'total_decaisse' => 0,
                'error' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Liste paginée des primes garage
     */
    public function primesIndex(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->get('per_page', 20);
            $page = (int) $request->get('page', 1);
            $search = $request->get('search');
            $statut = $request->get('statut', 'a_decaisser');

            $items = $this->fetchGaragePrimes($search);
            $items = $this->attachPrimeDecaissementStatus($items);

            if ($statut === 'a_decaisser') {
                $items = $items->filter(fn($i) => !$i->decaisse && !$i->refusee);
            } elseif ($statut === 'decaisse') {
                $items = $items->filter(fn($i) => $i->decaisse);
            } elseif ($statut === 'refusee') {
                $items = $items->filter(fn($i) => $i->refusee);
            }

            $items = $items->sortByDesc('created_at')->values();
            $total = $items->count();
            $paginated = $items->forPage($page, $perPage)->values();

            return response()->json([
                'data' => $paginated,
                'meta' => ['total' => $total, 'last_page' => max(1, ceil($total / $perPage)), 'current_page' => $page, 'per_page' => $perPage],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'data' => [], 'meta' => ['total' => 0, 'last_page' => 1, 'current_page' => 1, 'per_page' => 20],
                'error' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Décaisser une prime garage
     */
    public function decaisserPrime(Request $request, string $itemId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mode_paiement' => 'required|in:Espèces,Virement,Chèque,Mobile Money',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'categorie' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $refUnique = CaisseGarageController::buildPrimeRef($itemId);

        if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
            return response()->json(['message' => 'Cette prime a déjà été décaissée'], 422);
        }

        $items = $this->fetchGaragePrimes();
        $item = $items->firstWhere('id', $itemId);
        if (!$item) {
            return response()->json(['message' => 'Prime garage non trouvée'], 404);
        }

        try {
            DB::beginTransaction();

            $beneficiaire = $item->beneficiaire ?: 'Mécaniciens';
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);
            $categorie = $request->get('categorie', 'Primes Garage');

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => $categorie,
                'montant' => $item->montant,
                'description' => "Prime Garage - {$beneficiaire}" . ($item->numero ? " (N°{$item->numero})" : ''),
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            Audit::log('create', 'decaissement_garage_prime', "Décaissement prime Garage: {$item->montant} - {$beneficiaire}", $mouvement->id);
            DB::commit();

            return response()->json(['message' => 'Décaissement validé avec succès', 'mouvement' => $mouvement], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Refuser une prime garage
     */
    public function refuserPrime(Request $request, string $itemId): JsonResponse
    {
        $reference = CaisseGarageController::buildPrimeRef($itemId);

        if (DB::table('primes_refusees')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Déjà refusée'], 422);
        }
        if (DB::table('mouvements_caisse')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Déjà décaissée'], 422);
        }

        try {
            DB::table('primes_refusees')->insert([
                'prime_id' => $itemId,
                'source' => 'GARAGE_PRIME',
                'reference' => $reference,
                'motif' => $request->get('motif'),
                'user_id' => $request->user()?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Audit::log('create', 'refus_garage_prime', "Refus prime Garage: {$itemId}", null);
            return response()->json(['message' => 'Prime refusée avec succès']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Private helpers ──

    public function fetchGaragePrimes(?string $search = null): \Illuminate\Support\Collection
    {
        if (!$this->isAvailable()) return collect();

        $schema = Schema::connection('garage');
        $hasPrimesTable = $schema->hasTable('primes');
        $hasPrimeMecaniciensTable = $schema->hasTable('prime_mecaniciens');

        if (!$hasPrimesTable || !$hasPrimeMecaniciensTable) return collect();

        $hasInterventionsTable = $schema->hasTable('interventions');
        $hasMecaniciensTable = $schema->hasTable('mecaniciens');
        $hasStatut = $schema->hasColumn('primes', 'statut');
        $hasNumero = $schema->hasColumn('primes', 'numero');
        $hasCreatedAt = $schema->hasColumn('primes', 'created_at');
        $hasDeletedAt = $schema->hasColumn('primes', 'deleted_at');
        $hasInterventionId = $schema->hasColumn('primes', 'intervention_id');
        $hasObservations = $schema->hasColumn('primes', 'observations');
        $hasPrimeId = $schema->hasColumn('prime_mecaniciens', 'prime_id');
        $hasMontantPrime = $schema->hasColumn('prime_mecaniciens', 'montant_prime');
        $hasMontantRation = $schema->hasColumn('prime_mecaniciens', 'montant_ration');
        $hasMecanicienId = $schema->hasColumn('prime_mecaniciens', 'mecanicien_id');
        $hasMecanicienNom = $hasMecaniciensTable && $schema->hasColumn('mecaniciens', 'nom');
        $hasMecanicienPrenom = $hasMecaniciensTable && $schema->hasColumn('mecaniciens', 'prenom');

        if (!$hasStatut || !$hasPrimeId) return collect();

        $query = DB::connection('garage')->table('primes')->where('primes.statut', 'validé');

        if ($hasInterventionsTable && $hasInterventionId) {
            $query->leftJoin('interventions', 'primes.intervention_id', '=', 'interventions.id');
        }
        if ($hasDeletedAt) {
            $query->whereNull('primes.deleted_at');
        }

        $query->select([
            'primes.id',
            DB::raw($hasNumero ? 'primes.numero' : 'NULL as numero'),
            DB::raw($hasCreatedAt ? 'primes.created_at' : 'NULL as created_at'),
            DB::raw($hasInterventionId ? 'primes.intervention_id' : 'NULL as intervention_id'),
            DB::raw($hasObservations ? 'primes.observations' : 'NULL as observations'),
            DB::raw($hasInterventionsTable && $hasInterventionId ? 'interventions.numero as intervention_numero' : 'NULL as intervention_numero'),
        ]);

        if ($search) {
            $query->where(function ($q) use ($search, $hasNumero, $hasObservations, $hasInterventionsTable, $hasInterventionId) {
                if ($hasNumero) $q->where('primes.numero', 'like', "%{$search}%");
                if ($hasObservations) $hasNumero ? $q->orWhere('primes.observations', 'like', "%{$search}%") : $q->where('primes.observations', 'like', "%{$search}%");
                if ($hasInterventionsTable && $hasInterventionId) ($hasNumero || $hasObservations) ? $q->orWhere('interventions.numero', 'like', "%{$search}%") : $q->where('interventions.numero', 'like', "%{$search}%");
            });
        }

        $primes = ($hasCreatedAt ? $query->orderBy('primes.created_at', 'desc') : $query->orderByDesc('primes.id'))->get();
        if ($primes->isEmpty()) return collect();

        $primeIds = $primes->pluck('id')->toArray();

        $totals = DB::connection('garage')->table('prime_mecaniciens')
            ->whereIn('prime_id', $primeIds)
            ->selectRaw(sprintf('prime_id, SUM(%s) as total_prime, SUM(%s) as total_ration, COUNT(*) as nb_mecaniciens',
                $hasMontantPrime ? 'montant_prime' : '0', $hasMontantRation ? 'montant_ration' : '0'))
            ->groupBy('prime_id')->get()->keyBy('prime_id');

        $mecaniciensQuery = DB::connection('garage')->table('prime_mecaniciens')->whereIn('prime_mecaniciens.prime_id', $primeIds);
        if ($hasMecaniciensTable && $hasMecanicienId) {
            $mecaniciensQuery->leftJoin('mecaniciens', 'prime_mecaniciens.mecanicien_id', '=', 'mecaniciens.id');
        }
        $mecaniciens = $mecaniciensQuery->select([
            'prime_mecaniciens.prime_id',
            DB::raw($hasMecanicienNom ? 'mecaniciens.nom as nom' : 'NULL as nom'),
            DB::raw($hasMecanicienPrenom ? 'mecaniciens.prenom as prenom' : 'NULL as prenom'),
        ])->get()->groupBy('prime_id');

        return $primes->map(function ($p) use ($totals, $mecaniciens) {
            $t = $totals[$p->id] ?? null;
            $totalPrime = $t ? (float) $t->total_prime : 0;
            $totalRation = $t ? (float) $t->total_ration : 0;
            $montantTotal = $totalPrime + $totalRation;
            $nbMeca = $t ? (int) $t->nb_mecaniciens : 0;

            $mecaNames = isset($mecaniciens[$p->id])
                ? $mecaniciens[$p->id]->map(fn($m) => trim(($m->nom ?? '') . ' ' . ($m->prenom ?? '')))->filter()->implode(', ')
                : '';

            return (object) [
                'id' => 'gp-' . $p->id, 'type' => 'Prime garage', 'type_key' => 'prime_garage',
                'numero' => $p->numero, 'beneficiaire' => $mecaNames ?: 'Mécaniciens', 'fournisseur_nom' => null,
                'date' => $p->created_at, 'montant' => $montantTotal,
                'total_prime' => $totalPrime, 'total_ration' => $totalRation, 'nb_mecaniciens' => $nbMeca,
                'designation' => $p->observations, 'intervention_numero' => $p->intervention_numero,
                'created_at' => $p->created_at, 'source' => 'GARAGE',
            ];
        })->filter(fn($p) => $p->montant > 0);
    }

    private function attachPrimeDecaissementStatus(\Illuminate\Support\Collection $items): \Illuminate\Support\Collection
    {
        if ($items->isEmpty()) return $items;

        $refs = $items->map(fn($i) => CaisseGarageController::buildPrimeRef($i->id))->toArray();

        $mouvements = DB::table('mouvements_caisse')->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])->keyBy('reference');

        $refusees = DB::table('primes_refusees')->whereIn('reference', $refs)->pluck('reference')->toArray();

        return $items->map(function ($item) use ($mouvements, $refusees) {
            $ref = CaisseGarageController::buildPrimeRef($item->id);
            $mouvement = $mouvements[$ref] ?? null;
            $item->decaisse = $mouvement !== null;
            $item->mouvement_id = $mouvement?->id;
            $item->date_decaissement = $mouvement?->date;
            $item->mode_paiement_decaissement = $mouvement?->mode_paiement;
            $item->refusee = in_array($ref, $refusees);
            return $item;
        });
    }
}
