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
 * Contrôleur pour les primes OPS (TC) en attente de décaissement
 *
 * Structure table OPS `primes`:
 * id, sortie_conteneur_id, type, beneficiaire, responsable, montant,
 * payee, date_paiement, date_prime, reference_paiement, numero_paiement,
 * paiement_valide, statut, observations, created_at, updated_at, deleted_at
 *
 * Jointure avec `vehicules` pour récupérer l'immatriculation (numero_parc)
 */
class CaisseOpsController extends Controller
{
    public function isAvailable(): bool
    {
        try {
            DB::connection('ops')->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Récupère les primes OPS payées (payee=1)
     */
    public function fetchPrimes(?string $search = null): \Illuminate\Support\Collection
    {
        $query = DB::connection('ops')
            ->table('primes')
            ->leftJoin('vehicules', 'primes.vehicule_id', '=', 'vehicules.id')
            ->select([
                'primes.id',
                'primes.sortie_conteneur_id',
                'primes.type',
                'primes.beneficiaire',
                'primes.responsable',
                'primes.montant',
                'primes.payee',
                'primes.paiement_valide',
                'primes.date_paiement',
                'primes.date_prime',
                'primes.reference_paiement',
                'primes.numero_paiement',
                'primes.statut',
                'primes.observations',
                'primes.created_at',
                'vehicules.immatriculation as numero_parc',
            ])
            ->where('primes.payee', 1)
            ->whereNull('primes.deleted_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('beneficiaire', 'like', "%{$search}%")
                  ->orWhere('numero_paiement', 'like', "%{$search}%")
                  ->orWhere('reference_paiement', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('observations', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('date_paiement', 'desc')
            ->orderBy('primes.id', 'desc')
            ->get()
            ->map(function ($p) {
                $p->source = 'OPS';
                return $p;
            });
    }

    /**
     * Récupère les stats des primes OPS
     */
    public function fetchStats(): \Illuminate\Support\Collection
    {
        return DB::connection('ops')
            ->table('primes')
            ->where('payee', 1)
            ->whereNull('deleted_at')
            ->get(['id', 'montant'])
            ->map(fn($p) => (object) ['id' => $p->id, 'montant' => $p->montant, 'ref' => self::buildRef($p->id)]);
    }

    public static function buildRef(int $id): string
    {
        return "OPS-PRIME-{$id}";
    }

    public static function categorie(): string
    {
        return 'Prime camion';
    }

    /**
     * Valider le décaissement d'une prime OPS
     */
    public function decaisser(Request $request, int $primeId): ?JsonResponse
    {
        if (!$this->isAvailable()) {
            return response()->json(['message' => 'Connexion OPS indisponible'], 503);
        }

        $prime = DB::connection('ops')->table('primes')->where('id', $primeId)->first();

        if (!$prime) {
            return response()->json(['message' => 'Prime OPS non trouvée'], 404);
        }

        if (!$prime->payee) {
            return response()->json(['message' => "Cette prime n'est pas marquée comme payée"], 422);
        }

        $refUnique = self::buildRef($primeId);

        if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
            return response()->json(['message' => 'Cette prime a déjà été décaissée'], 422);
        }

        return null; // Validation OK
    }

    /**
     * Récupère les infos de la prime pour le décaissement
     */
    public function getPrimeForDecaissement(int $primeId): ?object
    {
        $prime = DB::connection('ops')->table('primes')->where('id', $primeId)->first();
        if ($prime) {
            $prime->beneficiaire = $prime->beneficiaire ?: 'N/A';
            $prime->type = $prime->type ?? 'OPS';
            $prime->numero_paiement = $prime->numero_paiement ?? null;
        }
        return $prime;
    }
}
