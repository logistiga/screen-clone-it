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
 * Contrôleur pour les primes CNV (conventionnel) en attente de décaissement
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
     * Récupère les primes CNV payées
     */
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

    /**
     * Récupère les stats des primes CNV
     */
    public function fetchStats(): \Illuminate\Support\Collection
    {
        return DB::connection('cnv')
            ->table('primes')
            ->where('statut', 'payee')
            ->get(['id', 'montant'])
            ->map(fn($p) => (object) ['id' => $p->id, 'montant' => $p->montant, 'ref' => "CNV-PRIME-{$p->id}"]);
    }

    /**
     * Génère la référence unique pour une prime CNV
     */
    public static function buildRef(int $id): string
    {
        return "CNV-PRIME-{$id}";
    }

    /**
     * Catégorie de mouvement pour les primes CNV
     */
    public static function categorie(): string
    {
        return 'Prime conventionnel';
    }

    /**
     * Décaisser une prime CNV
     */
    public function decaisser(Request $request, int $primeId): ?JsonResponse
    {
        if (!$this->isAvailable()) {
            return response()->json(['message' => 'Connexion CNV indisponible'], 503);
        }

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

        return null; // Validation OK
    }

    /**
     * Récupère les infos de la prime pour le décaissement
     */
    public function getPrimeForDecaissement(int $primeId): ?object
    {
        $prime = DB::connection('cnv')->table('primes')->where('id', $primeId)->first();
        if ($prime) {
            $prime->type = $prime->type ?? 'CNV';
        }
        return $prime;
    }
}
