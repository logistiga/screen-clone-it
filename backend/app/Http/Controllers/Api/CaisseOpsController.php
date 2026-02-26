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
 * Colonnes réelles de la table OPS `primes` :
 *   id, type, beneficiaire, responsable, montant, payee,
 *   reference_paiement, numero_paiement, paiement_valide,
 *   statut, camion_plaque, parc, responsable_nom, prestataire_nom, created_at
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
     * Récupère les primes OPS payées (payee=true AND paiement_valide=true)
     */
    public function fetchPrimes(?string $search = null): \Illuminate\Support\Collection
    {
        $query = DB::connection('ops')
            ->table('primes')
            ->select([
                'primes.id',
                'primes.type',
                'primes.beneficiaire',
                'primes.responsable',
                'primes.montant',
                'primes.payee',
                'primes.reference_paiement',
                'primes.numero_paiement',
                'primes.paiement_valide',
                'primes.statut',
                'primes.camion_plaque',
                'primes.parc',
                'primes.responsable_nom',
                'primes.prestataire_nom',
                'primes.created_at',
            ])
            ->where('primes.payee', true)
            ->where('primes.paiement_valide', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('beneficiaire', 'like', "%{$search}%")
                  ->orWhere('responsable', 'like', "%{$search}%")
                  ->orWhere('reference_paiement', 'like', "%{$search}%")
                  ->orWhere('numero_paiement', 'like', "%{$search}%")
                  ->orWhere('camion_plaque', 'like', "%{$search}%")
                  ->orWhere('parc', 'like', "%{$search}%")
                  ->orWhere('responsable_nom', 'like', "%{$search}%")
                  ->orWhere('prestataire_nom', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('statut', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('primes.created_at', 'desc')
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
            ->where('payee', true)
            ->where('paiement_valide', true)
            ->get(['id', 'montant'])
            ->map(fn($p) => (object) ['id' => $p->id, 'montant' => $p->montant, 'ref' => self::buildRef($p->id)]);
    }

    public static function buildRef(string $id): string
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
    public function decaisser(Request $request, string $primeId): ?JsonResponse
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

        if (!$prime->paiement_valide) {
            return response()->json(['message' => "Cette prime n'est pas validée pour le paiement"], 422);
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
    public function getPrimeForDecaissement(string $primeId): ?object
    {
        $prime = DB::connection('ops')->table('primes')->where('id', $primeId)->first();
        if ($prime) {
            $prime->beneficiaire = $prime->beneficiaire ?: ($prime->prestataire_nom ?: 'N/A');
            $prime->type = $prime->type ?? 'OPS';
            $prime->numero_paiement = $prime->numero_paiement ?? null;
        }
        return $prime;
    }
}
