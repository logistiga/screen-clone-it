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
 * Contrôleur pour les primes camion (véhicules) depuis la base OPS
 * Ces primes sont marquées "payées" dans OPS et attendent un décaissement comptable dans FAC
 */
class PrimeCamionController extends Controller
{
    /**
     * Liste des primes camion en attente de décaissement (depuis OPS)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Vérifier la connexion OPS
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
            $statut = $request->get('statut', 'paye'); // Par défaut: primes payées (en attente décaissement)

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
                    'primes.date_paiement',
                ])
                ->leftJoin('vehicules', 'primes.vehicule_id', '=', 'vehicules.id')
                ->leftJoin('chauffeurs', 'primes.chauffeur_id', '=', 'chauffeurs.id')
                ->addSelect([
                    'vehicules.immatriculation as numero_camion',
                    'chauffeurs.nom as chauffeur_nom',
                    'chauffeurs.prenom as chauffeur_prenom',
                ]);

            // Filtrer par statut
            if ($statut && $statut !== 'all') {
                $query->where('primes.statut', $statut);
            }

            // Recherche
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('vehicules.immatriculation', 'like', "%{$search}%")
                      ->orWhere('primes.numero_conteneur', 'like', "%{$search}%")
                      ->orWhere('primes.numero_bl', 'like', "%{$search}%")
                      ->orWhere('primes.nom_client', 'like', "%{$search}%")
                      ->orWhere('chauffeurs.nom', 'like', "%{$search}%");
                });
            }

            // Compter le total
            $total = $query->count();

            // Pagination et tri
            $primes = $query
                ->orderBy('primes.date_sortie', 'desc')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            // Vérifier si la prime a déjà été décaissée dans FAC et récupérer le numéro de mouvement
            $primeIds = $primes->pluck('id')->toArray();
            $mouvementsDecaisses = DB::table('mouvements_caisse')
                ->where('categorie', 'Prime camion')
                ->whereIn('reference', array_map(fn($id) => "OPS-PRIME-{$id}", $primeIds))
                ->get(['id', 'reference'])
                ->keyBy(fn($m) => (int) str_replace('OPS-PRIME-', '', $m->reference));

            // Ajouter le flag décaissé et le numéro de mouvement
            $primes = $primes->map(function ($prime) use ($mouvementsDecaisses) {
                $mouvement = $mouvementsDecaisses->get($prime->id);
                $prime->decaisse = $mouvement !== null;
                $prime->mouvement_id = $mouvement?->id;
                return $prime;
            });

            return response()->json([
                'data' => $primes,
                'meta' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage),
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
     * Statistiques des primes camion
     */
    public function stats(): JsonResponse
    {
        try {
            if (!$this->checkOpsConnection()) {
                return response()->json([
                    'total_a_decaisser' => 0,
                    'nombre_primes' => 0,
                    'deja_decaissees' => 0,
                ]);
            }

            // Total des primes payées dans OPS
            $primesPayees = DB::connection('ops')
                ->table('primes')
                ->where('statut', 'paye')
                ->get(['id', 'montant']);

            $primeIds = $primesPayees->pluck('id')->toArray();
            
            // Compter combien sont déjà décaissées dans FAC
            $decaisseesCount = DB::table('mouvements_caisse')
                ->where('categorie', 'Prime camion')
                ->whereIn('reference', array_map(fn($id) => "OPS-PRIME-{$id}", $primeIds))
                ->count();

            // Calculer le total à décaisser (non encore décaissées)
            $decaisseesRefs = DB::table('mouvements_caisse')
                ->where('categorie', 'Prime camion')
                ->whereIn('reference', array_map(fn($id) => "OPS-PRIME-{$id}", $primeIds))
                ->pluck('reference')
                ->map(fn($ref) => (int) str_replace('OPS-PRIME-', '', $ref))
                ->toArray();

            $aDecaisser = $primesPayees->filter(fn($p) => !in_array($p->id, $decaisseesRefs));

            return response()->json([
                'total_a_decaisser' => $aDecaisser->sum('montant'),
                'nombre_primes' => $aDecaisser->count(),
                'deja_decaissees' => $decaisseesCount,
                'total_payees' => $primesPayees->sum('montant'),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'total_a_decaisser' => 0,
                'nombre_primes' => 0,
                'deja_decaissees' => 0,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Décaisser une prime camion (créer sortie de caisse dans FAC)
     */
    public function decaisser(Request $request, int $primeId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mode_paiement' => 'required|in:Espèces,Virement,Chèque,Mobile Money',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Vérifier la connexion OPS
            if (!$this->checkOpsConnection()) {
                return response()->json(['message' => 'Connexion OPS indisponible'], 503);
            }

            // Récupérer la prime depuis OPS
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

            if ($prime->statut !== 'paye') {
                return response()->json(['message' => 'Cette prime n\'est pas en statut payé'], 422);
            }

            // Vérifier si déjà décaissée
            $refUnique = "OPS-PRIME-{$primeId}";
            $dejaDecaissee = DB::table('mouvements_caisse')
                ->where('reference', $refUnique)
                ->exists();

            if ($dejaDecaissee) {
                return response()->json(['message' => 'Cette prime a déjà été décaissée'], 422);
            }

            DB::beginTransaction();

            // Déterminer le bénéficiaire
            $beneficiaire = trim("{$prime->chauffeur_nom} {$prime->chauffeur_prenom}") ?: 'Chauffeur';
            $numeroCamion = $prime->numero_camion ?: 'N/A';

            // Déterminer la source (caisse ou banque)
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            // Créer le mouvement de caisse/banque
            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => 'Prime camion',
                'montant' => $prime->montant,
                'description' => "Prime camion {$numeroCamion} - {$beneficiaire} - Conteneur: {$prime->numero_conteneur}",
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
            ]);

            Audit::log('create', 'decaissement_prime_camion', "Décaissement prime camion: {$prime->montant} - Camion {$numeroCamion}", $mouvement->id);

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
     * Vérifier la connexion OPS
     */
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
