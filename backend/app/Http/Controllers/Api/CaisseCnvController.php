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
 * Contrôleur autonome pour les primes CNV (conventionnel)
 * Gère listing, stats et décaissement indépendamment
 */
class CaisseCnvController extends Controller
{
    /**
     * Vérifie la connexion CNV
     */
    public function isAvailable(): bool
    {
        try {
            DB::connection('cnv')->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Liste des primes CNV payées en attente de décaissement
     */
    public function index(Request $request): JsonResponse
    {
        try {
            if (!$this->isAvailable()) {
                return response()->json([
                    'data' => [],
                    'meta' => ['total' => 0, 'current_page' => 1, 'per_page' => 20, 'last_page' => 1],
                    'message' => 'Connexion CNV indisponible',
                ], 200);
            }

            $perPage = $request->get('per_page', 20);
            $page = $request->get('page', 1);
            $search = $request->get('search');
            $statut = $request->get('statut', 'all');

            $primes = $this->fetchPrimes($search);
            $primes = $this->attachDecaissementStatus($primes);

            // Filtrage par statut de décaissement
            if ($statut === 'a_decaisser') {
                $primes = $primes->filter(fn($p) => !$p->decaisse);
            } elseif ($statut === 'decaisse') {
                $primes = $primes->filter(fn($p) => $p->decaisse);
            }

            $primes = $primes->sortByDesc('date_paiement')->values();
            $total = $primes->count();
            $items = $primes->slice(($page - 1) * $perPage, $perPage)->values();

            return response()->json([
                'data' => $items,
                'meta' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => $total,
                    'last_page' => max(1, ceil($total / $perPage)),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des primes CNV',
                'error' => $e->getMessage(),
                'data' => [],
                'meta' => ['total' => 0, 'current_page' => 1, 'per_page' => 20, 'last_page' => 1],
            ], 200);
        }
    }

    /**
     * Statistiques des primes CNV
     */
    public function stats(): JsonResponse
    {
        try {
            if (!$this->isAvailable()) {
                return response()->json([
                    'total_valide' => 0,
                    'nombre_primes' => 0,
                    'total_a_decaisser' => 0,
                    'nombre_a_decaisser' => 0,
                    'deja_decaissees' => 0,
                    'total_decaisse' => 0,
                    'message' => 'Connexion CNV indisponible',
                ]);
            }

            $allPrimes = $this->fetchStats();

            $refs = $allPrimes->pluck('ref')->toArray();
            $decaisseesRefs = [];
            if (!empty($refs)) {
                $decaisseesRefs = DB::table('mouvements_caisse')
                    ->where('categorie', self::categorie())
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
                'nombre_a_decaisser' => 0,
                'deja_decaissees' => 0,
                'total_decaisse' => 0,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Décaisser une prime CNV (créer sortie de caisse dans FAC)
     */
    public function decaisser(Request $request, string $primeId): JsonResponse
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

        if (!$this->isAvailable()) {
            return response()->json(['message' => 'Connexion CNV indisponible'], 503);
        }

        try {
            $prime = DB::connection('cnv')->table('primes')->where('id', $primeId)->first();

            if (!$prime) {
                return response()->json(['message' => 'Prime CNV non trouvée'], 404);
            }

            if ($prime->statut !== 'payee') {
                return response()->json(['message' => "Cette prime n'est pas marquée comme payée"], 422);
            }

            $refUnique = self::buildRef($primeId);

            if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
                return response()->json(['message' => 'Cette prime a déjà été décaissée'], 422);
            }

            DB::beginTransaction();

            $beneficiaire = $prime->beneficiaire ?? 'N/A';
            $type = $prime->type ?? 'CNV';
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            $description = "Prime {$type} - {$beneficiaire}";
            if ($prime->numero_paiement) {
                $description .= " - {$prime->numero_paiement}";
            }

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => self::categorie(),
                'montant' => $prime->montant,
                'description' => $description,
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            Audit::log('create', 'decaissement_caisse_attente', "Décaissement prime CNV: {$prime->montant} - {$beneficiaire}", $mouvement->id);

            DB::commit();

            return response()->json([
                'message' => 'Décaissement validé avec succès',
                'mouvement' => $mouvement,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors du décaissement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ── Helpers publics (utilisés aussi par l'orchestrateur) ──

    public function fetchPrimes(?string $search = null): \Illuminate\Support\Collection
    {
        $query = DB::connection('cnv')
            ->table('primes')
            ->select([
                'id',
                'type',
                'beneficiaire',
                'montant',
                'conventionne_numero',
                'statut',
                'numero_paiement',
                'date_paiement',
                'created_at',
            ])
            ->where('statut', 'payee');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('beneficiaire', 'like', "%{$search}%")
                  ->orWhere('numero_paiement', 'like', "%{$search}%")
                  ->orWhere('conventionne_numero', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('date_paiement', 'desc')->get()->map(function ($p) {
            $p->source = 'CNV';
            $p->sortie_conteneur_id = null;
            $p->responsable = null;
            $p->payee = true;
            $p->paiement_valide = true;
            $p->date_prime = null;
            $p->reference_paiement = null;
            $p->observations = null;
            return $p;
        });
    }

    public function fetchStats(): \Illuminate\Support\Collection
    {
        return DB::connection('cnv')
            ->table('primes')
            ->where('statut', 'payee')
            ->get(['id', 'montant'])
            ->map(fn($p) => (object) ['id' => $p->id, 'montant' => $p->montant, 'ref' => self::buildRef($p->id)]);
    }

    public static function buildRef($id): string
    {
        return "CNV-PRIME-{$id}";
    }

    public static function categorie(): string
    {
        return 'Prime conventionnel';
    }

    public function getPrimeForDecaissement($primeId): ?object
    {
        $prime = DB::connection('cnv')->table('primes')->where('id', $primeId)->first();
        if ($prime) {
            $prime->type = $prime->type ?? 'CNV';
        }
        return $prime;
    }

    // ── Private helpers ──

    private function attachDecaissementStatus(\Illuminate\Support\Collection $primes): \Illuminate\Support\Collection
    {
        if ($primes->isEmpty()) return $primes;

        $refs = $primes->map(fn($p) => self::buildRef($p->id))->toArray();

        $mouvements = DB::table('mouvements_caisse')
            ->where('categorie', self::categorie())
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])
            ->keyBy('reference');

        return $primes->map(function ($prime) use ($mouvements) {
            $ref = self::buildRef($prime->id);
            $mouvement = $mouvements[$ref] ?? null;
            $prime->decaisse = $mouvement !== null;
            $prime->mouvement_id = $mouvement?->id;
            $prime->date_decaissement = $mouvement?->date;
            $prime->mode_paiement_decaissement = $mouvement?->mode_paiement;
            return $prime;
        });
    }
}
