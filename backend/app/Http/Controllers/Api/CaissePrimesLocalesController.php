<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prime;
use App\Models\Audit;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
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
            $perPage = $request->get('per_page', 20);
            $page = $request->get('page', 1);
            $search = $request->get('search');
            $statut = $request->get('statut', 'a_decaisser');

            $query = Prime::with(['representant', 'transitaire', 'facture'])
                ->where('statut', 'Payée');

            if ($type === 'representant') {
                $query->whereNotNull('representant_id');
            } else {
                $query->whereNotNull('transitaire_id');
            }

            if ($search) {
                $query->where(function ($q) use ($search, $type) {
                    if ($type === 'representant') {
                        $q->whereHas('representant', fn($r) => $r->where('nom', 'like', "%{$search}%")
                            ->orWhere('prenom', 'like', "%{$search}%"));
                    } else {
                        $q->whereHas('transitaire', fn($r) => $r->where('nom', 'like', "%{$search}%"));
                    }
                    $q->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('montant', 'like', "%{$search}%");
                });
            }

            $primes = $query->orderBy('date_paiement', 'desc')->get();

            // Map to caisse-en-attente format
            $mapped = $primes->map(function ($prime) use ($type) {
                $source = $type === 'representant' ? 'PRIME_REP' : 'PRIME_TRANS';
                $beneficiaire = $type === 'representant'
                    ? ($prime->representant ? "{$prime->representant->nom} {$prime->representant->prenom}" : 'N/A')
                    : ($prime->transitaire?->nom ?? 'N/A');

                return (object) [
                    'id' => (string) $prime->id,
                    'type' => $prime->description ?? 'Prime',
                    'beneficiaire' => $beneficiaire,
                    'responsable' => null,
                    'montant' => (float) $prime->montant,
                    'payee' => true,
                    'reference_paiement' => null,
                    'numero_paiement' => $prime->facture?->numero,
                    'paiement_valide' => true,
                    'statut' => 'payee',
                    'camion_plaque' => null,
                    'parc' => null,
                    'responsable_nom' => null,
                    'prestataire_nom' => null,
                    'created_at' => $prime->created_at->toISOString(),
                    'date_paiement' => $prime->date_paiement?->toISOString(),
                    'source' => $source,
                    'decaisse' => false,
                    'refusee' => false,
                    'mouvement_id' => null,
                    'date_decaissement' => null,
                    'mode_paiement_decaissement' => null,
                ];
            });

            // Attach décaissement status
            $mapped = $this->attachDecaissementStatus($mapped);

            // Filter by statut
            if ($statut === 'a_decaisser') {
                $mapped = $mapped->filter(fn($p) => !$p->decaisse && !$p->refusee);
            } elseif ($statut === 'decaisse') {
                $mapped = $mapped->filter(fn($p) => $p->decaisse);
            } elseif ($statut === 'refusee') {
                $mapped = $mapped->filter(fn($p) => $p->refusee);
            }

            $mapped = $mapped->values();
            $total = $mapped->count();
            $paginated = $mapped->slice(($page - 1) * $perPage, $perPage)->values();

            return response()->json([
                'data' => $paginated,
                'meta' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => $total,
                    'last_page' => max(1, ceil($total / $perPage)),
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'data' => [],
                'meta' => ['total' => 0],
            ], 200);
        }
    }

    /**
     * Stats pour un type (representant ou transitaire)
     */
    public function stats(string $type): JsonResponse
    {
        try {
            $query = Prime::where('statut', 'Payée');
            if ($type === 'representant') {
                $query->whereNotNull('representant_id');
            } else {
                $query->whereNotNull('transitaire_id');
            }

            $primes = $query->get();

            $mapped = $primes->map(function ($prime) use ($type) {
                $ref = self::buildRef($prime->id, $type);
                return (object) [
                    'id' => $prime->id,
                    'montant' => (float) $prime->montant,
                    'ref' => $ref,
                ];
            });

            $refs = $mapped->pluck('ref')->toArray();
            $decaisseesRefs = [];
            $refuseesRefs = [];
            if (!empty($refs)) {
                $decaisseesRefs = DB::table('mouvements_caisse')
                    ->whereIn('reference', $refs)
                    ->pluck('reference')
                    ->toArray();
                $refuseesRefs = DB::table('primes_refusees')
                    ->whereIn('reference', $refs)
                    ->pluck('reference')
                    ->toArray();
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
        } catch (\Exception $e) {
            return response()->json([
                'total_valide' => 0, 'nombre_primes' => 0,
                'total_a_decaisser' => 0, 'nombre_a_decaisser' => 0,
                'deja_decaissees' => 0, 'total_decaisse' => 0,
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

            // Partial payment logic
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
        } catch (\Exception $e) {
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
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Private ──

    private function attachDecaissementStatus(\Illuminate\Support\Collection $primes): \Illuminate\Support\Collection
    {
        if ($primes->isEmpty()) return $primes;

        $refs = $primes->map(fn($p) => self::buildRef($p->id, $p->source === 'PRIME_REP' ? 'representant' : 'transitaire'))->toArray();

        $mouvements = DB::table('mouvements_caisse')
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])
            ->keyBy('reference');

        $refusees = DB::table('primes_refusees')
            ->whereIn('reference', $refs)
            ->pluck('reference')
            ->toArray();

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
