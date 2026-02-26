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
 * Contrôleur pour la Caisse en attente
 * Affiche les primes OPS et CNV payées en attente de décaissement comptable
 */
class CaisseEnAttenteController extends Controller
{
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

            // ── OPS ──
            if (in_array($sourceFilter, ['all', 'OPS']) && $this->checkOpsConnection()) {
                $allPrimes = $allPrimes->merge($this->fetchOpsPrimes($search));
            }

            // ── CNV ──
            if (in_array($sourceFilter, ['all', 'CNV']) && $this->checkCnvConnection()) {
                $allPrimes = $allPrimes->merge($this->fetchCnvPrimes($search));
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

            if ($this->checkOpsConnection()) {
                $opsPrimes = DB::connection('ops')
                    ->table('primes')
                    ->where('payee', 1)
                    ->whereNull('deleted_at')
                    ->get(['id', 'montant'])
                    ->map(fn($p) => (object) ['id' => $p->id, 'montant' => $p->montant, 'ref' => "OPS-PRIME-{$p->id}"]);
                $allPrimes = $allPrimes->merge($opsPrimes);
            }

            if ($this->checkCnvConnection()) {
                $cnvPrimes = DB::connection('cnv')
                    ->table('primes')
                    ->where('statut', 'payee')
                    ->get(['id', 'montant'])
                    ->map(fn($p) => (object) ['id' => $p->id, 'montant' => $p->montant, 'ref' => "CNV-PRIME-{$p->id}"]);
                $allPrimes = $allPrimes->merge($cnvPrimes);
            }

            $refs = $allPrimes->pluck('ref')->toArray();
            $decaisseesRefs = [];
            if (!empty($refs)) {
                $decaisseesRefs = DB::table('mouvements_caisse')
                    ->whereIn('categorie', ['Prime camion', 'Prime conventionnel'])
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
    public function decaisser(Request $request, int $primeId): JsonResponse
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
            if ($source === 'CNV') {
                if (!$this->checkCnvConnection()) {
                    return response()->json(['message' => 'Connexion CNV indisponible'], 503);
                }
                $prime = DB::connection('cnv')->table('primes')->where('id', $primeId)->first();
                $refUnique = "CNV-PRIME-{$primeId}";
                $categorie = 'Prime conventionnel';
                $payeeCheck = ($prime && $prime->statut === 'payee');
            } else {
                if (!$this->checkOpsConnection()) {
                    return response()->json(['message' => 'Connexion OPS indisponible'], 503);
                }
                $prime = DB::connection('ops')->table('primes')->where('id', $primeId)->first();
                $refUnique = "OPS-PRIME-{$primeId}";
                $categorie = 'Prime camion';
                $payeeCheck = ($prime && $prime->payee);
            }

            if (!$prime) {
                return response()->json(['message' => 'Prime non trouvée'], 404);
            }

            if (!$payeeCheck) {
                return response()->json(['message' => 'Cette prime n\'est pas marquée comme payée'], 422);
            }

            $dejaDecaissee = DB::table('mouvements_caisse')
                ->where('reference', $refUnique)
                ->exists();

            if ($dejaDecaissee) {
                return response()->json(['message' => 'Cette prime a déjà été décaissée'], 422);
            }

            DB::beginTransaction();

            $beneficiaire = $prime->beneficiaire ?: 'N/A';
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

    private function fetchOpsPrimes(?string $search): \Illuminate\Support\Collection
    {
        $query = DB::connection('ops')
            ->table('primes')
            ->select([
                'primes.id',
                'primes.ordre_id',
                'primes.facture_id',
                'primes.transitaire_id',
                'primes.representant_id',
                'primes.montant',
                'primes.description',
                'primes.statut',
                'primes.date_paiement',
                'primes.created_at',
            ])
            ->whereNotNull('primes.date_paiement')
            ->whereNull('primes.deleted_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('statut', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('date_paiement', 'desc')->get()->map(function ($p) {
            $p->source = 'OPS';
            $p->type = null;
            $p->beneficiaire = $p->description ?? 'N/A';
            $p->payee = true;
            $p->numero_paiement = null;
            $p->observations = $p->description ?? null;
            $p->conventionne_numero = null;
            return $p;
        });
    }

    private function fetchCnvPrimes(?string $search): \Illuminate\Support\Collection
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

    private function attachDecaissementStatus(\Illuminate\Support\Collection $primes): \Illuminate\Support\Collection
    {
        if ($primes->isEmpty()) return $primes;

        $refs = $primes->map(function ($p) {
            return $p->source === 'CNV' ? "CNV-PRIME-{$p->id}" : "OPS-PRIME-{$p->id}";
        })->toArray();

        $mouvements = DB::table('mouvements_caisse')
            ->whereIn('categorie', ['Prime camion', 'Prime conventionnel'])
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])
            ->keyBy('reference');

        return $primes->map(function ($prime) use ($mouvements) {
            $ref = $prime->source === 'CNV' ? "CNV-PRIME-{$prime->id}" : "OPS-PRIME-{$prime->id}";
            $mouvement = $mouvements[$ref] ?? null;
            $prime->decaisse = $mouvement !== null;
            $prime->mouvement_id = $mouvement?->id;
            $prime->date_decaissement = $mouvement?->date;
            $prime->mode_paiement_decaissement = $mouvement?->mode_paiement;
            return $prime;
        });
    }

    private function checkOpsConnection(): bool
    {
        try {
            DB::connection('ops')->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function checkCnvConnection(): bool
    {
        try {
            DB::connection('cnv')->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
