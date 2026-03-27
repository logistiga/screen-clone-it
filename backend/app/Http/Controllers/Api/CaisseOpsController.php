<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Récupère les primes OPS payées (payee=true AND paiement_valide=true)
     */
    public function fetchPrimes(?string $search = null): \Illuminate\Support\Collection
    {
        $schema = Schema::connection('ops');
        $hasNumeroPaiement = $schema->hasColumn('primes', 'numero_paiement');
        $hasCreatedAt = $schema->hasColumn('primes', 'created_at');
        $optionalColumns = collect([
            'type',
            'beneficiaire',
            'responsable',
            'reference_paiement',
            'numero_paiement',
            'statut',
            'camion_plaque',
            'parc',
            'responsable_nom',
            'prestataire_nom',
            'created_at',
        ])->filter(fn($column) => $schema->hasColumn('primes', $column))->values()->all();

        $query = DB::connection('ops')
            ->table('primes')
            ->select(array_merge(
                ['primes.id', 'primes.montant', 'primes.payee', 'primes.paiement_valide'],
                array_map(fn($column) => 'primes.' . $column, $optionalColumns)
            ))
            ->where('primes.payee', true)
            ->where('primes.paiement_valide', true);

        if ($search) {
            $searchableColumns = array_values(array_filter([
                'beneficiaire',
                'responsable',
                'reference_paiement',
                'numero_paiement',
                'camion_plaque',
                'parc',
                'responsable_nom',
                'prestataire_nom',
                'type',
                'statut',
            ], fn($column) => $schema->hasColumn('primes', $column)));

            if (!empty($searchableColumns)) {
                $query->where(function ($q) use ($search, $searchableColumns) {
                    foreach ($searchableColumns as $index => $column) {
                        if ($index === 0) {
                            $q->where($column, 'like', "%{$search}%");
                        } else {
                            $q->orWhere($column, 'like', "%{$search}%");
                        }
                    }
                });
            }
        }

        $primes = ($hasCreatedAt ? $query->orderBy('primes.created_at', 'desc') : $query->orderByDesc('primes.id'))
            ->get()
            ->map(function ($prime) use ($hasNumeroPaiement, $hasCreatedAt) {
                $prime->type = $prime->type ?? null;
                $prime->beneficiaire = $prime->beneficiaire ?? null;
                $prime->responsable = $prime->responsable ?? null;
                $prime->reference_paiement = $prime->reference_paiement ?? null;
                $prime->numero_paiement = $hasNumeroPaiement ? ($prime->numero_paiement ?? null) : null;
                $prime->statut = $prime->statut ?? null;
                $prime->camion_plaque = $prime->camion_plaque ?? null;
                $prime->parc = $prime->parc ?? null;
                $prime->responsable_nom = $prime->responsable_nom ?? null;
                $prime->prestataire_nom = $prime->prestataire_nom ?? null;
                $prime->created_at = $hasCreatedAt ? ($prime->created_at ?? null) : null;

                return $prime;
            });

        if (!$hasNumeroPaiement) {
            return $primes->map(function ($p) {
                $p->source = 'OPS';
                $p->prime_ids = [(string) $p->id];
                $p->nombre_primes = 1;
                return $p;
            })->values();
        }

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
        $schema = Schema::connection('ops');
        $hasNumeroPaiement = $schema->hasColumn('primes', 'numero_paiement');

        $primes = DB::connection('ops')
            ->table('primes')
            ->where('payee', true)
            ->where('paiement_valide', true)
            ->get($hasNumeroPaiement ? ['id', 'montant', 'numero_paiement'] : ['id', 'montant'])
            ->map(function ($prime) use ($hasNumeroPaiement) {
                if (!$hasNumeroPaiement) {
                    $prime->numero_paiement = null;
                }

                return $prime;
            });

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
