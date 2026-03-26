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
            $connection = DB::connection('ops');
            $connection->getPdo();

            return $connection->getSchemaBuilder()->hasTable('primes');
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

        $primes = $query->orderBy('primes.created_at', 'desc')->get();

        // Regrouper par numero_paiement
        return $this->groupByNumeroPaiement($primes);
    }

    /**
     * Regroupe les primes ayant le même numero_paiement en une seule ligne
     * avec le montant cumulé. Les primes sans numero_paiement restent individuelles.
     */
    private function groupByNumeroPaiement(\Illuminate\Support\Collection $primes): \Illuminate\Support\Collection
    {
        $withNumero = $primes->filter(fn($p) => !empty($p->numero_paiement));
        $withoutNumero = $primes->filter(fn($p) => empty($p->numero_paiement))
            ->map(function ($p) {
                $p->source = 'OPS';
                $p->prime_ids = [(string) $p->id];
                $p->nombre_primes = 1;
                return $p;
            });

        $grouped = $withNumero->groupBy('numero_paiement')->map(function ($group) {
            $first = $group->first();
            $merged = clone $first;
            $merged->montant = $group->sum('montant');
            $merged->id = 'PAY-' . $first->numero_paiement; // ID composite
            $merged->source = 'OPS';
            $merged->prime_ids = $group->pluck('id')->map(fn($id) => (string) $id)->values()->toArray();
            $merged->nombre_primes = $group->count();

            // Collecter les types, bénéficiaires uniques
            $types = $group->pluck('type')->unique()->filter()->implode(', ');
            if ($types) $merged->type = $types;

            $beneficiaires = $group->pluck('beneficiaire')->unique()->filter();
            if ($beneficiaires->count() > 1) {
                $merged->beneficiaire = $beneficiaires->first() . ' (+' . ($beneficiaires->count() - 1) . ')';
            }

            // Garder la date la plus récente
            $merged->created_at = $group->max('created_at');

            return $merged;
        })->values();

        return $withoutNumero->merge($grouped)->sortByDesc('created_at')->values();
    }

    /**
     * Récupère les stats des primes OPS
     */
    public function fetchStats(): \Illuminate\Support\Collection
    {
        $primes = DB::connection('ops')
            ->table('primes')
            ->where('payee', true)
            ->where('paiement_valide', true)
            ->get(['id', 'montant', 'numero_paiement']);

        // Regrouper par numero_paiement pour les stats aussi
        $withNumero = $primes->filter(fn($p) => !empty($p->numero_paiement));
        $withoutNumero = $primes->filter(fn($p) => empty($p->numero_paiement))
            ->map(fn($p) => (object) ['id' => $p->id, 'montant' => $p->montant, 'ref' => self::buildRef((string) $p->id)]);

        $grouped = $withNumero->groupBy('numero_paiement')->map(function ($group) {
            $first = $group->first();
            $id = 'PAY-' . $first->numero_paiement;
            return (object) [
                'id' => $id,
                'montant' => $group->sum('montant'),
                'ref' => self::buildRef($id),
            ];
        })->values();

        return $withoutNumero->merge($grouped);
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
     * Valider le décaissement d'une prime OPS (ou groupe de primes)
     */
    public function decaisser(Request $request, string $primeId): ?JsonResponse
    {
        if (!$this->isAvailable()) {
            return response()->json(['message' => 'Connexion OPS indisponible'], 503);
        }

        // Si c'est un groupe (PAY-xxx), vérifier les primes du groupe
        if (str_starts_with($primeId, 'PAY-')) {
            $numeroPaiement = substr($primeId, 4);
            $primes = DB::connection('ops')->table('primes')
                ->where('numero_paiement', $numeroPaiement)
                ->where('payee', true)
                ->where('paiement_valide', true)
                ->get();

            if ($primes->isEmpty()) {
                return response()->json(['message' => 'Aucune prime trouvée pour ce paiement'], 404);
            }
        } else {
            $prime = DB::connection('ops')->table('primes')->where('id', $primeId)->first();
            if (!$prime) return response()->json(['message' => 'Prime OPS non trouvée'], 404);
            if (!$prime->payee) return response()->json(['message' => "Cette prime n'est pas marquée comme payée"], 422);
            if (!$prime->paiement_valide) return response()->json(['message' => "Cette prime n'est pas validée pour le paiement"], 422);
        }

        $refUnique = self::buildRef($primeId);
        if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
            return response()->json(['message' => 'Ce paiement a déjà été décaissé'], 422);
        }

        return null;
    }

    /**
     * Récupère les infos de la prime (ou groupe) pour le décaissement
     */
    public function getPrimeForDecaissement(string $primeId): ?object
    {
        if (str_starts_with($primeId, 'PAY-')) {
            $numeroPaiement = substr($primeId, 4);
            $primes = DB::connection('ops')->table('primes')
                ->where('numero_paiement', $numeroPaiement)
                ->where('payee', true)
                ->where('paiement_valide', true)
                ->get();

            if ($primes->isEmpty()) return null;

            $first = $primes->first();
            return (object) [
                'id' => $primeId,
                'montant' => $primes->sum('montant'),
                'beneficiaire' => $first->beneficiaire ?: ($first->prestataire_nom ?: 'N/A'),
                'type' => $primes->pluck('type')->unique()->filter()->implode(', ') ?: 'OPS',
                'numero_paiement' => $numeroPaiement,
            ];
        }

        $prime = DB::connection('ops')->table('primes')->where('id', $primeId)->first();
        if ($prime) {
            $prime->beneficiaire = $prime->beneficiaire ?: ($prime->prestataire_nom ?: 'N/A');
            $prime->type = $prime->type ?? 'OPS';
            $prime->numero_paiement = $prime->numero_paiement ?? null;
        }
        return $prime;
    }
}
