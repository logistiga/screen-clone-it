<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prime;
use App\Models\Audit;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

/**
 * Gère les primes locales (représentant/transitaire) dans la Caisse en attente.
 * Les primes payées apparaissent ici pour validation avant d'être envoyées à la caisse.
 */
class CaissePrimesLocalesController extends Controller
{
    public static function categorieRep(): string { return 'Prime représentant'; }
    public static function categorieTrans(): string { return 'Prime transitaire'; }

    public static function buildRef(string $id, string $type): string
    {
        $prefix = $type === 'transitaire' ? 'TRANS' : 'REP';
        return "PRIME-{$prefix}-{$id}";
    }

    /**
     * Liste des primes payées (représentant ou transitaire) en attente de décaissement
     */
    public function index(Request $request, string $type): JsonResponse
    {
        try {
            $perPage = (int) $request->get('per_page', 20);
            $page = (int) $request->get('page', 1);
            $search = trim((string) $request->get('search', ''));
            $statut = $request->get('statut', 'a_decaisser');

            if (!Schema::hasTable('primes')) {
                return $this->emptyIndexResponse($page, $perPage, 'Table primes non disponible');
            }

            $foreignKey = $type === 'representant' ? 'representant_id' : 'transitaire_id';
            if (!Schema::hasColumn('primes', $foreignKey)) {
                return $this->emptyIndexResponse($page, $perPage, "Colonne {$foreignKey} non disponible");
            }

            $query = DB::table('primes')->select('primes.*');

            if (Schema::hasColumn('primes', 'deleted_at')) {
                $query->whereNull('primes.deleted_at');
            }

            if (Schema::hasColumn('primes', 'statut')) {
                $query->whereIn('primes.statut', ['Payée', 'Payee', 'payee']);
            }

            $query->whereNotNull("primes.{$foreignKey}");

            if ($search !== '') {
                $searchLike = "%{$search}%";
                $query->where(function ($q) use ($searchLike, $type, $foreignKey) {
                    if (Schema::hasColumn('primes', 'description')) {
                        $q->orWhere('primes.description', 'like', $searchLike);
                    }

                    if (Schema::hasColumn('primes', 'montant')) {
                        $q->orWhere('primes.montant', 'like', $searchLike);
                    }

                    if ($type === 'representant' && Schema::hasTable('representants')) {
                        $q->orWhereExists(function ($sub) use ($searchLike, $foreignKey) {
                            $sub->select(DB::raw(1))
                                ->from('representants')
                                ->whereColumn('representants.id', "primes.{$foreignKey}")
                                ->where(function ($rep) use ($searchLike) {
                                    if (Schema::hasColumn('representants', 'nom')) {
                                        $rep->orWhere('representants.nom', 'like', $searchLike);
                                    }
                                    if (Schema::hasColumn('representants', 'prenom')) {
                                        $rep->orWhere('representants.prenom', 'like', $searchLike);
                                    }
                                });

                            if (Schema::hasColumn('representants', 'deleted_at')) {
                                $sub->whereNull('representants.deleted_at');
                            }
                        });
                    }

                    if ($type === 'transitaire' && Schema::hasTable('transitaires') && Schema::hasColumn('transitaires', 'nom')) {
                        $q->orWhereExists(function ($sub) use ($searchLike, $foreignKey) {
                            $sub->select(DB::raw(1))
                                ->from('transitaires')
                                ->whereColumn('transitaires.id', "primes.{$foreignKey}")
                                ->where('transitaires.nom', 'like', $searchLike);

                            if (Schema::hasColumn('transitaires', 'deleted_at')) {
                                $sub->whereNull('transitaires.deleted_at');
                            }
                        });
                    }
                });
            }

            if (Schema::hasColumn('primes', 'date_paiement')) {
                $query->orderByDesc('primes.date_paiement');
            } elseif (Schema::hasColumn('primes', 'created_at')) {
                $query->orderByDesc('primes.created_at');
            } else {
                $query->orderByDesc('primes.id');
            }

            $primes = collect($query->get());
            $factureNumbers = $this->loadFactureNumbers($primes);
            $beneficiaires = $this->loadBeneficiaires($primes, $type);

            $mapped = $primes->map(function ($prime) use ($type, $factureNumbers, $beneficiaires) {
                $source = $type === 'representant' ? 'PRIME_REP' : 'PRIME_TRANS';

                return (object) [
                    'id' => (string) $prime->id,
                    'type' => property_exists($prime, 'description') && $prime->description ? $prime->description : 'Prime',
                    'beneficiaire' => $beneficiaires[(int) $prime->id] ?? 'N/A',
                    'responsable' => null,
                    'montant' => (float) ($prime->montant ?? 0),
                    'payee' => true,
                    'reference_paiement' => null,
                    'numero_paiement' => $factureNumbers[(int) $prime->id] ?? null,
                    'paiement_valide' => true,
                    'statut' => 'payee',
                    'camion_plaque' => null,
                    'parc' => null,
                    'responsable_nom' => null,
                    'prestataire_nom' => null,
                    'created_at' => $this->toIsoString($prime->created_at ?? null),
                    'date_paiement' => $this->toIsoString($prime->date_paiement ?? null),
                    'source' => $source,
                    'decaisse' => false,
                    'refusee' => false,
                    'mouvement_id' => null,
                    'date_decaissement' => null,
                    'mode_paiement_decaissement' => null,
                ];
            });

            $mapped = $this->attachDecaissementStatus($mapped);

            if ($statut === 'a_decaisser') {
                $mapped = $mapped->filter(fn($p) => !$p->decaisse && !$p->refusee);
            } elseif ($statut === 'decaisse') {
                $mapped = $mapped->filter(fn($p) => $p->decaisse);
            } elseif ($statut === 'refusee') {
                $mapped = $mapped->filter(fn($p) => $p->refusee);
            }

            $mapped = $mapped->values();
            $total = $mapped->count();
            $paginated = $mapped->slice(max(0, ($page - 1) * $perPage), $perPage)->values();

            return response()->json([
                'data' => $paginated,
                'meta' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => max(1, (int) ceil($total / max(1, $perPage))),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'data' => [],
                'meta' => [
                    'total' => 0,
                    'current_page' => 1,
                    'per_page' => 20,
                    'last_page' => 1,
                ],
            ], 200);
        }
    }

    /**
     * Stats pour un type (representant ou transitaire)
     */
    public function stats(string $type): JsonResponse
    {
        try {
            if (!Schema::hasTable('primes')) {
                return response()->json($this->emptyStatsPayload());
            }

            $foreignKey = $type === 'representant' ? 'representant_id' : 'transitaire_id';
            if (!Schema::hasColumn('primes', $foreignKey)) {
                return response()->json($this->emptyStatsPayload());
            }

            $query = DB::table('primes')->select(['id', 'montant']);

            if (Schema::hasColumn('primes', 'deleted_at')) {
                $query->whereNull('deleted_at');
            }

            if (Schema::hasColumn('primes', 'statut')) {
                $query->whereIn('statut', ['Payée', 'Payee', 'payee']);
            }

            $query->whereNotNull($foreignKey);
            $primes = collect($query->get());

            $mapped = $primes->map(function ($prime) use ($type) {
                $ref = self::buildRef((string) $prime->id, $type);

                return (object) [
                    'id' => $prime->id,
                    'montant' => (float) ($prime->montant ?? 0),
                    'ref' => $ref,
                ];
            });

            $refs = $mapped->pluck('ref')->toArray();
            $decaisseesRefs = [];
            $refuseesRefs = [];

            if (!empty($refs)) {
                if (Schema::hasTable('mouvements_caisse')) {
                    $decaisseesRefs = DB::table('mouvements_caisse')
                        ->whereIn('reference', $refs)
                        ->pluck('reference')
                        ->toArray();
                }

                if (Schema::hasTable('primes_refusees')) {
                    $refuseesRefs = DB::table('primes_refusees')
                        ->whereIn('reference', $refs)
                        ->pluck('reference')
                        ->toArray();
                }
            }

            $aDecaisser = $mapped->filter(fn($p) => !in_array($p->ref, $decaisseesRefs) && !in_array($p->ref, $refuseesRefs));
            $dejaDecaissees = $mapped->filter(fn($p) => in_array($p->ref, $decaisseesRefs));

            return response()->json([
                'total_valide' => $mapped->sum('montant'),
                'nombre_primes' => $mapped->count(),
                'total_a_decaisser' => $aDecaisser->sum('montant'),
                'nombre_a_decaisser' => $aDecaisser->count(),
                'deja_decaissees' => $dejaDecaissees->count(),
                'total_decaisse' => $dejaDecaissees->sum('montant'),
            ]);
        } catch (\Throwable $e) {
            return response()->json($this->emptyStatsPayload() + [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Décaisser une prime locale
     */
    public function decaisser(Request $request, string $primeId, string $type): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mode_paiement' => 'required|in:Espèces,Virement,Chèque,Mobile Money',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'categorie' => 'nullable|string|max:100',
            'montant' => 'nullable|numeric|min:1',
            'paiement_partiel' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $prime = Prime::with(['representant', 'transitaire'])->find($primeId);
            if (!$prime || $prime->statut !== 'Payée') {
                return response()->json(['message' => 'Prime non trouvée ou non payée'], 404);
            }

            $refUnique = self::buildRef($primeId, $type);
            $categorie = $request->get('categorie') ?: ($type === 'representant' ? self::categorieRep() : self::categorieTrans());
            $isPaiementPartiel = $request->boolean('paiement_partiel', false);
            $montantDecaisse = $isPaiementPartiel && $request->has('montant')
                ? (float) $request->montant
                : (float) $prime->montant;

            if ($montantDecaisse > $prime->montant) {
                return response()->json(['message' => 'Le montant dépasse le montant de la prime'], 422);
            }

            if ($isPaiementPartiel && $montantDecaisse < $prime->montant) {
                $existingPF = DB::table('paiements_fournisseurs')
                    ->where('source', $type === 'representant' ? 'PRIME_REP' : 'PRIME_TRANS')
                    ->where('source_id', $primeId)
                    ->first();

                if (!$existingPF) {
                    $beneficiaire = $type === 'representant'
                        ? ($prime->representant ? "{$prime->representant->nom} {$prime->representant->prenom}" : 'N/A')
                        : ($prime->transitaire?->nom ?? 'N/A');

                    $pfId = DB::table('paiements_fournisseurs')->insertGetId([
                        'fournisseur' => $beneficiaire,
                        'reference' => $refUnique,
                        'description' => "Prime {$type} - {$beneficiaire}",
                        'montant_total' => $prime->montant,
                        'date_facture' => now()->toDateString(),
                        'source' => $type === 'representant' ? 'PRIME_REP' : 'PRIME_TRANS',
                        'source_id' => $primeId,
                        'created_by' => $request->user()?->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $existingPF = (object) ['id' => $pfId];
                }

                $totalDejaPaye = DB::table('tranches_paiement_fournisseur')
                    ->where('paiement_fournisseur_id', $existingPF->id)
                    ->sum('montant');

                $reste = $prime->montant - $totalDejaPaye;
                if ($montantDecaisse > $reste) {
                    return response()->json(['message' => "Le montant ({$montantDecaisse}) dépasse le reste à payer ({$reste})"], 422);
                }

                $numTranche = DB::table('tranches_paiement_fournisseur')
                    ->where('paiement_fournisseur_id', $existingPF->id)
                    ->count() + 1;
                $refUnique .= '-T' . $numTranche;
            } else {
                if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
                    return response()->json(['message' => 'Cette prime a déjà été décaissée'], 422);
                }
            }

            DB::beginTransaction();

            $beneficiaire = $type === 'representant'
                ? ($prime->representant ? "{$prime->representant->nom} {$prime->representant->prenom}" : 'N/A')
                : ($prime->transitaire?->nom ?? 'N/A');

            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => $categorie,
                'montant' => $montantDecaisse,
                'description' => ($isPaiementPartiel ? 'Avance - ' : '') . "Prime {$type} - {$beneficiaire}",
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            if ($isPaiementPartiel && $montantDecaisse < $prime->montant && isset($existingPF)) {
                DB::table('tranches_paiement_fournisseur')->insert([
                    'paiement_fournisseur_id' => $existingPF->id,
                    'montant' => $montantDecaisse,
                    'mode_paiement' => $request->mode_paiement,
                    'reference' => $request->reference,
                    'notes' => $request->notes,
                    'date_paiement' => now()->toDateString(),
                    'numero_tranche' => $numTranche ?? 1,
                    'mouvement_id' => $mouvement->id,
                    'created_by' => $request->user()?->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            Audit::log('create', 'decaissement_prime_locale', "Décaissement prime {$type}: {$montantDecaisse} - {$beneficiaire}", $mouvement->id);

            DB::commit();

            return response()->json([
                'message' => $isPaiementPartiel ? 'Avance enregistrée avec succès' : 'Décaissement validé avec succès',
                'mouvement' => $mouvement,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors du décaissement', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Refuser une prime locale
     */
    public function refuser(Request $request, string $primeId, string $type): JsonResponse
    {
        $reference = self::buildRef($primeId, $type);

        if (DB::table('primes_refusees')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cette prime a déjà été refusée'], 422);
        }
        if (DB::table('mouvements_caisse')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cette prime a déjà été décaissée'], 422);
        }

        try {
            DB::table('primes_refusees')->insert([
                'prime_id' => $primeId,
                'source' => $type === 'representant' ? 'PRIME_REP' : 'PRIME_TRANS',
                'reference' => $reference,
                'motif' => $request->get('motif'),
                'user_id' => $request->user()?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Audit::log('create', 'refus_prime_locale', "Refus prime {$type}: {$primeId}", null);

            return response()->json(['message' => 'Prime refusée avec succès']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Private ──

    private function emptyIndexResponse(int $page, int $perPage, string $message): JsonResponse
    {
        return response()->json([
            'data' => [],
            'meta' => [
                'total' => 0,
                'current_page' => $page,
                'per_page' => $perPage,
                'last_page' => 1,
            ],
            'message' => $message,
        ]);
    }

    private function emptyStatsPayload(): array
    {
        return [
            'total_valide' => 0,
            'nombre_primes' => 0,
            'total_a_decaisser' => 0,
            'nombre_a_decaisser' => 0,
            'deja_decaissees' => 0,
            'total_decaisse' => 0,
        ];
    }

    private function loadFactureNumbers(\Illuminate\Support\Collection $primes): array
    {
        if (
            $primes->isEmpty() ||
            !Schema::hasTable('factures') ||
            !Schema::hasColumn('primes', 'facture_id') ||
            !Schema::hasColumn('factures', 'numero')
        ) {
            return [];
        }

        $factureIds = $primes->pluck('facture_id')->filter()->unique()->values();
        if ($factureIds->isEmpty()) {
            return [];
        }

        $query = DB::table('factures')->select(['id', 'numero'])->whereIn('id', $factureIds);
        if (Schema::hasColumn('factures', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $factures = $query->pluck('numero', 'id');

        return $primes
            ->filter(fn($prime) => !empty($prime->facture_id) && isset($factures[$prime->facture_id]))
            ->mapWithKeys(fn($prime) => [(int) $prime->id => $factures[$prime->facture_id]])
            ->all();
    }

    private function loadBeneficiaires(\Illuminate\Support\Collection $primes, string $type): array
    {
        if ($primes->isEmpty()) {
            return [];
        }

        if ($type === 'representant') {
            if (!Schema::hasTable('representants') || !Schema::hasColumn('primes', 'representant_id')) {
                return [];
            }

            $ids = $primes->pluck('representant_id')->filter()->unique()->values();
            if ($ids->isEmpty()) {
                return [];
            }

            $query = DB::table('representants')->select('id');
            if (Schema::hasColumn('representants', 'nom')) {
                $query->addSelect('nom');
            }
            if (Schema::hasColumn('representants', 'prenom')) {
                $query->addSelect('prenom');
            }
            $query->whereIn('id', $ids);

            if (Schema::hasColumn('representants', 'deleted_at')) {
                $query->whereNull('deleted_at');
            }

            $beneficiaires = collect($query->get())->keyBy('id');

            return $primes->mapWithKeys(function ($prime) use ($beneficiaires) {
                $representant = $beneficiaires->get($prime->representant_id);
                if (!$representant) {
                    return [(int) $prime->id => 'N/A'];
                }

                $nom = trim(collect([$representant->nom ?? null, $representant->prenom ?? null])->filter()->implode(' '));

                return [(int) $prime->id => $nom !== '' ? $nom : 'N/A'];
            })->all();
        }

        if (!Schema::hasTable('transitaires') || !Schema::hasColumn('primes', 'transitaire_id')) {
            return [];
        }

        $ids = $primes->pluck('transitaire_id')->filter()->unique()->values();
        if ($ids->isEmpty()) {
            return [];
        }

        $query = DB::table('transitaires')->select(['id', 'nom'])->whereIn('id', $ids);
        if (Schema::hasColumn('transitaires', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $beneficiaires = $query->pluck('nom', 'id');

        return $primes->mapWithKeys(fn($prime) => [
            (int) $prime->id => $beneficiaires[$prime->transitaire_id] ?? 'N/A',
        ])->all();
    }

    private function toIsoString(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }

        try {
            return \Illuminate\Support\Carbon::parse($value)->toISOString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function attachDecaissementStatus(\Illuminate\Support\Collection $primes): \Illuminate\Support\Collection
    {
        if ($primes->isEmpty()) {
            return $primes;
        }

        $refs = $primes->map(fn($p) => self::buildRef($p->id, $p->source === 'PRIME_REP' ? 'representant' : 'transitaire'))->toArray();

        $mouvements = collect();
        $refusees = [];

        if (Schema::hasTable('mouvements_caisse')) {
            $mouvements = DB::table('mouvements_caisse')
                ->whereIn('reference', $refs)
                ->get(['id', 'reference', 'date', 'mode_paiement'])
                ->keyBy('reference');
        }

        if (Schema::hasTable('primes_refusees')) {
            $refusees = DB::table('primes_refusees')
                ->whereIn('reference', $refs)
                ->pluck('reference')
                ->toArray();
        }

        return $primes->map(function ($prime) use ($mouvements, $refusees) {
            $ref = self::buildRef($prime->id, $prime->source === 'PRIME_REP' ? 'representant' : 'transitaire');
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
