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
 * Affiche les primes OPS payées en attente de décaissement comptable
 * 
 * Structure table OPS `primes`:
 * id, sortie_conteneur_id, type, beneficiaire, responsable, montant, 
 * payee, date_paiement, date_prime, reference_paiement, numero_paiement,
 * paiement_valide, statut, observations, created_at, updated_at, deleted_at
 */
class CaisseEnAttenteController extends Controller
{
    /**
     * Liste des primes payées en attente de décaissement
     */
    public function index(Request $request): JsonResponse
    {
        try {
            if (!$this->checkOpsConnection()) {
                return response()->json([
                    'message' => 'Connexion à la base OPS indisponible',
                    'data' => [],
                    'meta' => ['total' => 0]
                ], 200);
            }

            $perPage = $request->get('per_page', 20);
            $page = $request->get('page', 1);
            $search = $request->get('search');
            $statut = $request->get('statut', 'all');

            $query = DB::connection('ops')
                ->table('primes')
                ->select([
                    'id',
                    'sortie_conteneur_id',
                    'type',
                    'beneficiaire',
                    'responsable',
                    'montant',
                    'payee',
                    'paiement_valide',
                    'date_paiement',
                    'date_prime',
                    'reference_paiement',
                    'numero_paiement',
                    'statut',
                    'observations',
                    'created_at',
                ])
                ->where('payee', 1)
                ->whereNull('deleted_at');

            // Recherche
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('beneficiaire', 'like', "%{$search}%")
                      ->orWhere('numero_paiement', 'like', "%{$search}%")
                      ->orWhere('reference_paiement', 'like', "%{$search}%")
                      ->orWhere('type', 'like', "%{$search}%")
                      ->orWhere('observations', 'like', "%{$search}%");
                });
            }

            $query->orderBy('date_paiement', 'desc')
                  ->orderBy('id', 'desc');

            $allPrimes = $query->get();

            // Vérifier le statut de décaissement dans FAC
            $primeIds = $allPrimes->pluck('id')->toArray();
            $mouvementsDecaisses = [];
            
            if (!empty($primeIds)) {
                $mouvementsDecaisses = DB::table('mouvements_caisse')
                    ->where('categorie', 'Prime camion')
                    ->whereIn('reference', array_map(fn($id) => "OPS-PRIME-{$id}", $primeIds))
                    ->get(['id', 'reference', 'date', 'mode_paiement'])
                    ->keyBy(fn($m) => (int) str_replace('OPS-PRIME-', '', $m->reference));
            }

            // Ajouter les infos de décaissement
            $allPrimes = $allPrimes->map(function ($prime) use ($mouvementsDecaisses) {
                $mouvement = $mouvementsDecaisses[$prime->id] ?? null;
                $prime->decaisse = $mouvement !== null;
                $prime->mouvement_id = $mouvement?->id;
                $prime->date_decaissement = $mouvement?->date;
                $prime->mode_paiement_decaissement = $mouvement?->mode_paiement;
                return $prime;
            });

            // Filtrage par statut de décaissement
            if ($statut === 'a_decaisser') {
                $allPrimes = $allPrimes->filter(fn($p) => !$p->decaisse);
            } elseif ($statut === 'decaisse') {
                $allPrimes = $allPrimes->filter(fn($p) => $p->decaisse);
            }

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
     * Statistiques de la caisse en attente
     */
    public function stats(): JsonResponse
    {
        try {
            if (!$this->checkOpsConnection()) {
                return response()->json([
                    'total_valide' => 0,
                    'nombre_primes' => 0,
                    'total_a_decaisser' => 0,
                    'deja_decaissees' => 0,
                ]);
            }

            $primesPayees = DB::connection('ops')
                ->table('primes')
                ->where('payee', 1)
                ->whereNull('deleted_at')
                ->get(['id', 'montant']);

            $primeIds = $primesPayees->pluck('id')->toArray();

            $decaisseesRefs = [];
            if (!empty($primeIds)) {
                $decaisseesRefs = DB::table('mouvements_caisse')
                    ->where('categorie', 'Prime camion')
                    ->whereIn('reference', array_map(fn($id) => "OPS-PRIME-{$id}", $primeIds))
                    ->pluck('reference')
                    ->map(fn($ref) => (int) str_replace('OPS-PRIME-', '', $ref))
                    ->toArray();
            }

            $aDecaisser = $primesPayees->filter(fn($p) => !in_array($p->id, $decaisseesRefs));
            $dejaDecaissees = $primesPayees->filter(fn($p) => in_array($p->id, $decaisseesRefs));

            return response()->json([
                'total_valide' => $primesPayees->sum('montant'),
                'nombre_primes' => $primesPayees->count(),
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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if (!$this->checkOpsConnection()) {
                return response()->json(['message' => 'Connexion OPS indisponible'], 503);
            }

            $prime = DB::connection('ops')
                ->table('primes')
                ->where('id', $primeId)
                ->first();

            if (!$prime) {
                return response()->json(['message' => 'Prime non trouvée'], 404);
            }

            if (!$prime->payee) {
                return response()->json(['message' => 'Cette prime n\'est pas marquée comme payée'], 422);
            }

            $refUnique = "OPS-PRIME-{$primeId}";
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
            if ($prime->numero_paiement) {
                $description .= " - {$prime->numero_paiement}";
            }

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => 'Prime camion',
                'montant' => $prime->montant,
                'description' => $description,
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            Audit::log('create', 'decaissement_caisse_attente', "Décaissement prime: {$prime->montant} - {$beneficiaire}", $mouvement->id);

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

    private function checkOpsConnection(): bool
    {
        try {
            DB::connection('ops')->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
