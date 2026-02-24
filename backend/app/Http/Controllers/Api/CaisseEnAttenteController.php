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
 * Affiche les primes OPS validées (payee=1 ET paiement_valide=1) en attente de décaissement comptable
 */
class CaisseEnAttenteController extends Controller
{
    /**
     * Liste des primes validées en attente de décaissement
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
                    'primes.id',
                    'primes.vehicule_id',
                    'primes.chauffeur_id',
                    'primes.sortie_conteneur_id',
                    'primes.voyage_id',
                    'primes.numero_conteneur',
                    'primes.numero_bl',
                    'primes.nom_client',
                    'primes.date_sortie',
                    'primes.montant',
                    'primes.statut',
                    'primes.type',
                    'primes.beneficiaire',
                    'primes.observations',
                    'primes.payee',
                    'primes.paiement_valide',
                    'primes.numero_paiement',
                    'primes.date_paiement',
                    'primes.reference_paiement',
                ])
                ->leftJoin('vehicules', 'primes.vehicule_id', '=', 'vehicules.id')
                ->leftJoin('chauffeurs', 'primes.chauffeur_id', '=', 'chauffeurs.id')
                ->addSelect([
                    'vehicules.immatriculation as numero_camion',
                    'chauffeurs.nom as chauffeur_nom',
                    'chauffeurs.prenom as chauffeur_prenom',
                ])
                // Filtre principal: toutes les primes payées
                ->where('primes.payee', 1);

            // Filtrer par statut de décaissement
            if ($statut === 'a_decaisser') {
                // Sera filtré après la vérification des mouvements
            } elseif ($statut === 'decaisse') {
                // Sera filtré après la vérification des mouvements
            }

            // Recherche
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('vehicules.immatriculation', 'like', "%{$search}%")
                      ->orWhere('primes.numero_conteneur', 'like', "%{$search}%")
                      ->orWhere('primes.numero_bl', 'like', "%{$search}%")
                      ->orWhere('primes.nom_client', 'like', "%{$search}%")
                      ->orWhere('chauffeurs.nom', 'like', "%{$search}%")
                      ->orWhere('primes.numero_paiement', 'like', "%{$search}%");
                });
            }

            $query->orderBy('primes.date_paiement', 'desc')
                  ->orderBy('primes.id', 'desc');

            // Récupérer toutes les primes pour le filtrage post-query
            $allPrimes = $query->get();
            
            // Vérifier le statut de décaissement dans FAC
            $primeIds = $allPrimes->pluck('id')->toArray();
            $mouvementsDecaisses = DB::table('mouvements_caisse')
                ->where('categorie', 'Prime camion')
                ->whereIn('reference', array_map(fn($id) => "OPS-PRIME-{$id}", $primeIds))
                ->get(['id', 'reference', 'date', 'mode_paiement'])
                ->keyBy(fn($m) => (int) str_replace('OPS-PRIME-', '', $m->reference));

            // Ajouter les infos de décaissement
            $allPrimes = $allPrimes->map(function ($prime) use ($mouvementsDecaisses) {
                $mouvement = $mouvementsDecaisses->get($prime->id);
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

            $primesValidees = DB::connection('ops')
                ->table('primes')
                ->where('payee', 1)
                ->get(['id', 'montant']);

            $primeIds = $primesValidees->pluck('id')->toArray();

            $decaisseesRefs = DB::table('mouvements_caisse')
                ->where('categorie', 'Prime camion')
                ->whereIn('reference', array_map(fn($id) => "OPS-PRIME-{$id}", $primeIds))
                ->pluck('reference')
                ->map(fn($ref) => (int) str_replace('OPS-PRIME-', '', $ref))
                ->toArray();

            $aDecaisser = $primesValidees->filter(fn($p) => !in_array($p->id, $decaisseesRefs));
            $dejaDecaissees = $primesValidees->filter(fn($p) => in_array($p->id, $decaisseesRefs));

            return response()->json([
                'total_valide' => $primesValidees->sum('montant'),
                'nombre_primes' => $primesValidees->count(),
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
     * Décaisser une prime validée (créer sortie de caisse dans FAC)
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
                ->leftJoin('vehicules', 'primes.vehicule_id', '=', 'vehicules.id')
                ->leftJoin('chauffeurs', 'primes.chauffeur_id', '=', 'chauffeurs.id')
                ->where('primes.id', $primeId)
                ->select([
                    'primes.*',
                    'vehicules.immatriculation as numero_camion',
                    'chauffeurs.nom as chauffeur_nom',
                    'chauffeurs.prenom as chauffeur_prenom',
                ])
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

            $beneficiaire = trim("{$prime->chauffeur_nom} {$prime->chauffeur_prenom}") ?: 'Chauffeur';
            $numeroCamion = $prime->numero_camion ?: 'N/A';
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => 'Prime camion',
                'montant' => $prime->montant,
                'description' => "Prime camion {$numeroCamion} - {$beneficiaire} - Conteneur: {$prime->numero_conteneur}" . 
                    ($prime->numero_paiement ? " - Paiement: {$prime->numero_paiement}" : ''),
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            Audit::log('create', 'decaissement_caisse_attente', "Décaissement prime validée: {$prime->montant} - Camion {$numeroCamion}", $mouvement->id);

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
