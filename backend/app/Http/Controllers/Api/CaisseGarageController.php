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
 * Contrôleur pour les achats Garage validés en attente de décaissement
 * 
 * Lit uniquement les achats VALIDÉS depuis la base garage (logiwkuh_gr)
 * puis gère le décaissement/refus localement (même pattern que OPS/CNV/HORSLBV)
 * 
 * Tables sources (base garage, READ ONLY) :
 * - bon_commandes (statut = 'validé')
 * - achat_pneus (statut = 'valide')
 * - achats_divers (statut = 'valide')
 */
class CaisseGarageController extends Controller
{
    private const PISTON_GABON = 'piston gabon';
    private const GARAGE_PRIME_PREFIX = 'GARAGE-PRIME-';

    public static function buildRef(string $id): string
    {
        return 'GARAGE-ACHAT-' . $id;
    }

    public static function buildPrimeRef(string $id): string
    {
        return 'GARAGE-PRIME-' . $id;
    }

    public static function categorie(): string
    {
        return 'Achats Garage';
    }

    public function isAvailable(): bool
    {
        try {
            $connection = DB::connection('garage');
            $connection->getPdo();
            return $connection->getSchemaBuilder()->hasTable('bon_commandes');
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Stats des achats garage validés (en attente de décaissement)
     */
    public function stats(Request $request): JsonResponse
    {
        if (!$this->isAvailable()) {
            return response()->json([
                'total_valide' => 0,
                'nombre_primes' => 0,
                'total_a_decaisser' => 0,
                'nombre_a_decaisser' => 0,
                'deja_decaissees' => 0,
                'total_decaisse' => 0,
                'message' => 'Base Garage indisponible',
            ]);
        }

        try {
            $filter = $request->get('fournisseur_filter', 'all');
            $allItems = $this->fetchAllValidated(null, $filter);
            $allItems = $this->attachDecaissementStatus($allItems);

            $aDecaisser = $allItems->filter(fn($i) => !$i->decaisse && !$i->refusee);
            $decaissees = $allItems->filter(fn($i) => $i->decaisse);

            return response()->json([
                'total_valide' => $allItems->sum('montant'),
                'nombre_primes' => $allItems->count(),
                'total_a_decaisser' => $aDecaisser->sum('montant'),
                'nombre_a_decaisser' => $aDecaisser->count(),
                'deja_decaissees' => $decaissees->count(),
                'total_decaisse' => $decaissees->sum('montant'),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'total_valide' => 0,
                'nombre_primes' => 0,
                'total_a_decaisser' => 0,
                'nombre_a_decaisser' => 0,
                'deja_decaissees' => 0,
                'total_decaisse' => 0,
                'error' => 'Erreur: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Liste des achats garage validés avec statut décaissement
     */
    public function index(Request $request): JsonResponse
    {
        if (!$this->isAvailable()) {
            return response()->json([
                'data' => [],
                'meta' => ['total' => 0, 'last_page' => 1, 'current_page' => 1, 'per_page' => 20],
                'message' => 'Base Garage indisponible',
            ]);
        }

        try {
            $perPage = (int) $request->get('per_page', 20);
            $page = (int) $request->get('page', 1);
            $search = $request->get('search');
            $statut = $request->get('statut', 'all');
            $fournisseurFilter = $request->get('fournisseur_filter', 'all');

            $allItems = $this->fetchAllValidated($search, $fournisseurFilter);
            $allItems = $this->attachDecaissementStatus($allItems);

            // Filtrer par statut de décaissement
            if ($statut === 'a_decaisser') {
                $allItems = $allItems->filter(fn($i) => !$i->decaisse && !$i->refusee);
            } elseif ($statut === 'decaisse') {
                $allItems = $allItems->filter(fn($i) => $i->decaisse);
            } elseif ($statut === 'refusee') {
                $allItems = $allItems->filter(fn($i) => $i->refusee);
            }

            $allItems = $allItems->sortByDesc('date')->values();
            $total = $allItems->count();
            $lastPage = max(1, ceil($total / $perPage));
            $items = $allItems->forPage($page, $perPage)->values();

            return response()->json([
                'data' => $items,
                'meta' => [
                    'total' => $total,
                    'last_page' => $lastPage,
                    'current_page' => $page,
                    'per_page' => $perPage,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'data' => [],
                'meta' => ['total' => 0, 'last_page' => 1, 'current_page' => 1, 'per_page' => 20],
                'error' => 'Erreur: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ─── Fetch validated items from garage DB ───────────────

    private function fetchAllValidated(?string $search, string $fournisseurFilter): \Illuminate\Support\Collection
    {
        $allItems = collect();
        $hasFournisseursTable = Schema::connection('garage')->hasTable('fournisseurs');

        if (Schema::connection('garage')->hasTable('bon_commandes')) {
            $allItems = $allItems->merge($this->fetchBonCommandes($search, $fournisseurFilter, $hasFournisseursTable));
        }
        if (Schema::connection('garage')->hasTable('achat_pneus')) {
            $allItems = $allItems->merge($this->fetchAchatPneus($search, $fournisseurFilter, $hasFournisseursTable));
        }
        if (Schema::connection('garage')->hasTable('achats_divers')) {
            $allItems = $allItems->merge($this->fetchAchatsDivers($search, $fournisseurFilter, $hasFournisseursTable));
        }

        return $allItems;
    }

    private function fetchBonCommandes(?string $search, string $fournisseurFilter, bool $hasFournisseursTable): \Illuminate\Support\Collection
    {
        $query = DB::connection('garage')
            ->table('bon_commandes')
            ->whereIn('bon_commandes.statut', ['validé', 'validated']);

        if ($hasFournisseursTable) {
            $query->leftJoin('fournisseurs', 'bon_commandes.fournisseur_id', '=', 'fournisseurs.id');
        }

        $query->select([
            'bon_commandes.id',
            'bon_commandes.numero',
            'bon_commandes.date_commande as date',
            'bon_commandes.montant_total as montant',
            'bon_commandes.created_at',
            DB::raw($hasFournisseursTable ? 'fournisseurs.raison_sociale as fournisseur_nom' : 'NULL as fournisseur_nom'),
        ]);

        $query = $this->applyFournisseurFilter($query, $fournisseurFilter, $hasFournisseursTable);

        if ($search) {
            $query->where(function ($q) use ($search, $hasFournisseursTable) {
                $q->where('bon_commandes.numero', 'like', "%{$search}%");
                if ($hasFournisseursTable) {
                    $q->orWhere('fournisseurs.raison_sociale', 'like', "%{$search}%");
                }
            });
        }

        return $query->get()->map(fn($row) => (object) [
            'id' => 'bc-' . $row->id,
            'type' => 'Bon de commande',
            'type_key' => 'bon_commande',
            'numero' => $row->numero,
            'beneficiaire' => $row->fournisseur_nom,
            'fournisseur_nom' => $row->fournisseur_nom,
            'date' => $row->date,
            'montant' => (float) $row->montant,
            'designation' => $row->numero,
            'created_at' => $row->created_at,
            'source' => 'GARAGE',
        ]);
    }

    private function fetchAchatPneus(?string $search, string $fournisseurFilter, bool $hasFournisseursTable): \Illuminate\Support\Collection
    {
        $query = DB::connection('garage')
            ->table('achat_pneus')
            ->whereIn('achat_pneus.statut', ['valide', 'validated']);

        if ($hasFournisseursTable) {
            $query->leftJoin('fournisseurs', 'achat_pneus.fournisseur_id', '=', 'fournisseurs.id');
        }

        $query->select([
            'achat_pneus.id',
            'achat_pneus.date_achat as date',
            'achat_pneus.marque',
            'achat_pneus.dimension',
            'achat_pneus.quantite',
            'achat_pneus.montant_total as montant',
            'achat_pneus.created_at',
            DB::raw($hasFournisseursTable ? 'fournisseurs.raison_sociale as fournisseur_nom' : 'NULL as fournisseur_nom'),
        ]);

        $query = $this->applyFournisseurFilter($query, $fournisseurFilter, $hasFournisseursTable);

        if ($search) {
            $query->where(function ($q) use ($search, $hasFournisseursTable) {
                $q->where('achat_pneus.marque', 'like', "%{$search}%")
                  ->orWhere('achat_pneus.dimension', 'like', "%{$search}%");

                if ($hasFournisseursTable) {
                    $q->orWhere('fournisseurs.raison_sociale', 'like', "%{$search}%");
                }
            });
        }

        return $query->get()->map(fn($row) => (object) [
            'id' => 'pn-' . $row->id,
            'type' => 'Achat pneu',
            'type_key' => 'achat_pneu',
            'numero' => null,
            'beneficiaire' => $row->fournisseur_nom,
            'fournisseur_nom' => $row->fournisseur_nom,
            'date' => $row->date,
            'montant' => (float) $row->montant,
            'designation' => ($row->marque ?? '') . ' ' . ($row->dimension ?? '') . ' (x' . ($row->quantite ?? 1) . ')',
            'created_at' => $row->created_at,
            'source' => 'GARAGE',
        ]);
    }

    private function fetchAchatsDivers(?string $search, string $fournisseurFilter, bool $hasFournisseursTable): \Illuminate\Support\Collection
    {
        $query = DB::connection('garage')
            ->table('achats_divers')
            ->whereIn('achats_divers.statut', ['valide', 'validated']);

        if ($hasFournisseursTable) {
            $query->leftJoin('fournisseurs', 'achats_divers.fournisseur_id', '=', 'fournisseurs.id');
        }

        $query->select([
            'achats_divers.id',
            'achats_divers.numero',
            'achats_divers.date_achat as date',
            'achats_divers.montant_total as montant',
            'achats_divers.created_at',
            DB::raw($hasFournisseursTable ? 'fournisseurs.raison_sociale as fournisseur_nom' : 'NULL as fournisseur_nom'),
        ]);

        $query = $this->applyFournisseurFilter($query, $fournisseurFilter, $hasFournisseursTable);

        if ($search) {
            $query->where(function ($q) use ($search, $hasFournisseursTable) {
                $q->where('achats_divers.numero', 'like', "%{$search}%")

                if ($hasFournisseursTable) {
                    $q->orWhere('fournisseurs.raison_sociale', 'like', "%{$search}%");
                }
            });
        }

        return $query->get()->map(fn($row) => (object) [
            'id' => 'div-' . $row->id,
            'type' => 'Achat divers',
            'type_key' => 'achat_divers',
            'numero' => $row->numero,
            'beneficiaire' => $row->fournisseur_nom,
            'fournisseur_nom' => $row->fournisseur_nom,
            'date' => $row->date,
            'montant' => (float) $row->montant,
            'designation' => $row->numero,
            'created_at' => $row->created_at,
            'source' => 'GARAGE',
        ]);
    }

    // ─── Décaissement / Refus (local) ───────────────────────

    /**
     * Décaisser un achat garage validé
     */
    public function decaisser(Request $request, string $itemId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mode_paiement' => 'required|in:Espèces,Virement,Chèque,Mobile Money',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $refUnique = self::buildRef($itemId);

        // Vérifier si déjà décaissé
        if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
            return response()->json(['message' => 'Cet achat a déjà été décaissé'], 422);
        }

        $item = $this->getPrimeForDecaissement($itemId);
        if (!$item) {
            return response()->json(['message' => 'Achat non trouvé'], 404);
        }

        try {
            DB::beginTransaction();

            $beneficiaire = $item->beneficiaire ?? $item->fournisseur_nom ?? 'Fournisseur Garage';
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            $description = "Achat Garage ({$item->type}) - {$beneficiaire}";

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => self::categorie(),
                'montant' => $item->montant,
                'description' => $description,
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            Audit::log('create', 'decaissement_garage', "Décaissement achat Garage: {$item->montant} - {$beneficiaire}", $mouvement->id);

            DB::commit();

            return response()->json([
                'message' => 'Décaissement validé avec succès',
                'mouvement' => $mouvement,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors du décaissement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Refuser un achat garage
     */
    public function refuser(Request $request, string $itemId): JsonResponse
    {
        $reference = self::buildRef($itemId);

        if (DB::table('primes_refusees')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cet achat a déjà été refusé'], 422);
        }

        if (DB::table('mouvements_caisse')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cet achat a déjà été décaissé, impossible de le refuser'], 422);
        }

        try {
            DB::table('primes_refusees')->insert([
                'prime_id' => $itemId,
                'source' => 'GARAGE',
                'reference' => $reference,
                'motif' => $request->get('motif'),
                'user_id' => $request->user()?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Audit::log('create', 'refus_garage', "Refus achat Garage: {$itemId}", null);

            return response()->json(['message' => 'Achat refusé avec succès'], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors du refus',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────

    private function applyFournisseurFilter($query, string $filter, bool $hasFournisseursTable)
    {
        if (!$hasFournisseursTable) {
            return $query;
        }

        if ($filter === 'piston') {
            $query->whereRaw('LOWER(fournisseurs.raison_sociale) LIKE ?', ['%' . self::PISTON_GABON . '%']);
        } elseif ($filter === 'autres') {
            $query->where(function ($q) {
                $q->whereNull('fournisseurs.raison_sociale')
                  ->orWhereRaw('LOWER(fournisseurs.raison_sociale) NOT LIKE ?', ['%' . self::PISTON_GABON . '%']);
            });
        }
        return $query;
    }

    /**
     * Attache le statut décaissé/refusé à chaque item
     */
    private function attachDecaissementStatus(\Illuminate\Support\Collection $items): \Illuminate\Support\Collection
    {
        if ($items->isEmpty()) return $items;

        $refs = $items->map(fn($i) => self::buildRef($i->id))->toArray();

        $mouvements = DB::table('mouvements_caisse')
            ->where('categorie', self::categorie())
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])
            ->keyBy('reference');

        $refusees = DB::table('primes_refusees')
            ->whereIn('reference', $refs)
            ->pluck('reference')
            ->toArray();

        return $items->map(function ($item) use ($mouvements, $refusees) {
            $ref = self::buildRef($item->id);
            $mouvement = $mouvements[$ref] ?? null;
            $item->decaisse = $mouvement !== null;
            $item->mouvement_id = $mouvement?->id;
            $item->date_decaissement = $mouvement?->date;
            $item->mode_paiement_decaissement = $mouvement?->mode_paiement;
            $item->refusee = in_array($ref, $refusees);
            return $item;
        });
    }

    /**
     * Récupère un achat pour le décaissement (utilisé par CaisseEnAttenteController)
     */
    public function getPrimeForDecaissement(string $itemId): ?object
    {
        if (!$this->isAvailable()) return null;

        $allItems = $this->fetchAllValidated(null, 'all');
        return $allItems->firstWhere('id', $itemId);
    }

    /**
     * Récupère toutes les primes validées (utilisé par CaisseEnAttenteController pour les stats)
     */
    public function fetchPrimes(?string $search): \Illuminate\Support\Collection
    {
        return $this->fetchAllValidated($search, 'all');
    }

    // ─── Primes Garage (prime_mecaniciens) ──────────────────

    /**
     * Récupère les primes garage validées depuis la table primes + prime_mecaniciens
     */
    public function fetchGaragePrimes(?string $search = null): \Illuminate\Support\Collection
    {
        if (!$this->isAvailable()) return collect();

        $schema = Schema::connection('garage');
        $hasPrimesTable = $schema->hasTable('primes');
        $hasPrimeMecaniciensTable = $schema->hasTable('prime_mecaniciens');

        if (!$hasPrimesTable || !$hasPrimeMecaniciensTable) return collect();

        $hasInterventionsTable = $schema->hasTable('interventions');
        $hasMecaniciensTable = $schema->hasTable('mecaniciens');
        $hasDeletedAt = $schema->hasColumn('primes', 'deleted_at');
        $hasInterventionId = $schema->hasColumn('primes', 'intervention_id');
        $hasObservations = $schema->hasColumn('primes', 'observations');

        $query = DB::connection('garage')
            ->table('primes')
            ->where('primes.statut', 'validé');

        if ($hasInterventionsTable && $hasInterventionId) {
            $query->leftJoin('interventions', 'primes.intervention_id', '=', 'interventions.id');
        }

        if ($hasDeletedAt) {
            $query->whereNull('primes.deleted_at');
        }

        $query->select([
            'primes.id',
            'primes.numero',
            'primes.created_at',
            DB::raw($hasInterventionId ? 'primes.intervention_id' : 'NULL as intervention_id'),
            DB::raw($hasObservations ? 'primes.observations' : 'NULL as observations'),
            DB::raw($hasInterventionsTable && $hasInterventionId ? 'interventions.numero as intervention_numero' : 'NULL as intervention_numero'),
        ]);

        if ($search) {
            $query->where(function ($q) use ($search, $hasObservations, $hasInterventionsTable, $hasInterventionId) {
                $q->where('primes.numero', 'like', "%{$search}%")

                if ($hasObservations) {
                    $q->orWhere('primes.observations', 'like', "%{$search}%");
                }

                if ($hasInterventionsTable && $hasInterventionId) {
                    $q->orWhere('interventions.numero', 'like', "%{$search}%");
                }
            });
        }

        $primes = $query->orderBy('primes.created_at', 'desc')->get();

        // Récupérer les montants depuis prime_mecaniciens
        if ($primes->isEmpty()) return collect();

        $primeIds = $primes->pluck('id')->toArray();

        $totals = DB::connection('garage')
            ->table('prime_mecaniciens')
            ->whereIn('prime_id', $primeIds)
            ->selectRaw('prime_id, SUM(montant_prime) as total_prime, SUM(montant_ration) as total_ration, COUNT(*) as nb_mecaniciens')
            ->groupBy('prime_id')
            ->get()
            ->keyBy('prime_id');

        // Récupérer les noms des mécaniciens
        $mecaniciensQuery = DB::connection('garage')
            ->table('prime_mecaniciens')
            ->whereIn('prime_mecaniciens.prime_id', $primeIds);

        if ($hasMecaniciensTable) {
            $mecaniciensQuery->leftJoin('mecaniciens', 'prime_mecaniciens.mecanicien_id', '=', 'mecaniciens.id');
        }

        $mecaniciens = $mecaniciensQuery
            ->select([
                'prime_mecaniciens.prime_id',
                DB::raw($hasMecaniciensTable ? 'mecaniciens.nom as nom' : 'NULL as nom'),
                DB::raw($hasMecaniciensTable ? 'mecaniciens.prenom as prenom' : 'NULL as prenom'),
            ])
            ->get()
            ->groupBy('prime_id');

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
                'id' => 'gp-' . $p->id,
                'type' => 'Prime garage',
                'type_key' => 'prime_garage',
                'numero' => $p->numero,
                'beneficiaire' => $mecaNames ?: 'Mécaniciens',
                'fournisseur_nom' => null,
                'date' => $p->created_at,
                'montant' => $montantTotal,
                'total_prime' => $totalPrime,
                'total_ration' => $totalRation,
                'nb_mecaniciens' => $nbMeca,
                'designation' => $p->observations,
                'intervention_numero' => $p->intervention_numero,
                'created_at' => $p->created_at,
                'source' => 'GARAGE',
            ];
        })->filter(fn($p) => $p->montant > 0);
    }

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
            ]);
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

        $refUnique = self::buildPrimeRef($itemId);

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
        $reference = self::buildPrimeRef($itemId);

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

    private function attachPrimeDecaissementStatus(\Illuminate\Support\Collection $items): \Illuminate\Support\Collection
    {
        if ($items->isEmpty()) return $items;

        $refs = $items->map(fn($i) => self::buildPrimeRef($i->id))->toArray();

        $mouvements = DB::table('mouvements_caisse')
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])
            ->keyBy('reference');

        $refusees = DB::table('primes_refusees')
            ->whereIn('reference', $refs)
            ->pluck('reference')
            ->toArray();

        return $items->map(function ($item) use ($mouvements, $refusees) {
            $ref = self::buildPrimeRef($item->id);
            $mouvement = $mouvements[$ref] ?? null;
            $item->decaisse = $mouvement !== null;
            $item->mouvement_id = $mouvement?->id;
            $item->date_decaissement = $mouvement?->date;
            $item->mode_paiement_decaissement = $mouvement?->mode_paiement;
            $item->refusee = in_array($ref, $refusees);
            return $item;
        });
    }
