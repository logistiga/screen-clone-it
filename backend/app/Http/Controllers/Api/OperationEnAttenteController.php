<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\OrdreTravail;
use App\Support\DocumentCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Opérations indépendantes en attente — lit depuis la base OPS
 * (table `operations_independantes` ou `operations`).
 * Actions : Confirmer (créer un OT) ou Ignorer.
 * Une fois traitée, l'opération n'apparaît plus dans la liste.
 */
class OperationEnAttenteController extends Controller
{
    use SyncDiagnosticHelpersTrait;

    /** Tables candidates dans OPS, par ordre de priorité */
    private const OPS_TABLES = ['operations_independantes', 'operations'];

    public function index(Request $request)
    {
        try {
            $this->refreshOpsIndConfigFromEnv();
            $table = $this->resolveOpsTable();
            if (!$table) {
                return response()->json([
                    'data' => [],
                    'meta' => $this->emptyMeta(),
                    'source_errors' => ['ops' => 'Table opérations introuvable dans la base OPS'],
                ]);
            }

            $cols = $this->columns($table);
            $idCol = $this->pickColumn($cols, ['id', 'operation_id']);
            if (!$idCol) {
                return response()->json([
                    'data' => [], 'meta' => $this->emptyMeta(),
                    'source_errors' => ['ops' => "Colonne id introuvable dans {$table}"],
                ]);
            }

            // IDs déjà traités (ignorés ou convertis)
            $traitedIds = DB::table('operations_externes_tracking')
                ->pluck('operation_id_externe')->toArray();

            $query = DB::connection('ops_ind')->table($table);
            if (!empty($traitedIds)) {
                $query->whereNotIn($idCol, $traitedIds);
            }

            // Recherche
            if ($search = $request->input('search')) {
                $searchable = array_intersect($cols, [
                    'numero', 'reference', 'client_nom', 'client', 'description',
                    'type', 'point_depart', 'point_arrivee',
                ]);
                if (!empty($searchable)) {
                    $query->where(function ($q) use ($searchable, $search) {
                        foreach ($searchable as $c) {
                            $q->orWhere($c, 'like', "%{$search}%");
                        }
                    });
                }
            }

            $dateCol = $this->pickColumn($cols, ['date_operation', 'date', 'created_at']);
            if ($dateCol) {
                $query->orderBy($dateCol, 'desc');
            } else {
                $query->orderBy($idCol, 'desc');
            }

            $perPage = min((int) $request->input('per_page', 20), 100);
            $results = $query->paginate($perPage);

            return response()->json([
                'data' => collect($results->items())->map(fn ($row) => $this->formatRow($row, $cols, $idCol)),
                'meta' => [
                    'current_page' => $results->currentPage(),
                    'last_page' => $results->lastPage(),
                    'per_page' => $results->perPage(),
                    'total' => $results->total(),
                    'ops_table' => $table,
                    'ops_columns' => $cols,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('OperationEnAttente.index', ['message' => $e->getMessage()]);
            return response()->json([
                'data' => [], 'meta' => $this->emptyMeta(),
                'source_errors' => ['ops' => $e->getMessage()],
            ], 200);
        }
    }

    public function stats()
    {
        try {
            $this->refreshOpsIndConfigFromEnv();
            $table = $this->resolveOpsTable();
            if (!$table) {
                return response()->json(['en_attente' => 0, 'ignorees' => 0, 'converties' => 0]);
            }
            $cols = $this->columns($table);
            $idCol = $this->pickColumn($cols, ['id', 'operation_id']);
            $traitedIds = DB::table('operations_externes_tracking')
                ->pluck('operation_id_externe')->toArray();

            $q = DB::connection('ops_ind')->table($table);
            if ($idCol && !empty($traitedIds)) $q->whereNotIn($idCol, $traitedIds);

            return response()->json([
                'en_attente' => $q->count(),
                'ignorees' => DB::table('operations_externes_tracking')->where('statut', 'ignore')->count(),
                'converties' => DB::table('operations_externes_tracking')->where('statut', 'converti')->count(),
            ]);
        } catch (\Throwable $e) {
            Log::error('OperationEnAttente.stats', ['message' => $e->getMessage()]);
            return response()->json(['en_attente' => 0, 'ignorees' => 0, 'converties' => 0]);
        }
    }

    public function ignorer(Request $request, string $operationId)
    {
        try {
            $this->refreshOpsIndConfigFromEnv();
            $snapshot = $this->fetchOpsRow($operationId);
            DB::table('operations_externes_tracking')->updateOrInsert(
                ['operation_id_externe' => $operationId],
                [
                    'statut' => 'ignore',
                    'traite_par' => Auth::id(),
                    'traite_at' => now(),
                    'snapshot' => $snapshot ? json_encode($snapshot, JSON_INVALID_UTF8_SUBSTITUTE) : null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            return response()->json(['success' => true, 'message' => 'Opération ignorée']);
        } catch (\Throwable $e) {
            Log::error('OperationEnAttente.ignorer', ['id' => $operationId, 'message' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function confirmer(Request $request, string $operationId)
    {
        try {
            $this->refreshOpsIndConfigFromEnv();
            $row = $this->fetchOpsRow($operationId);
            if (!$row) {
                return response()->json(['success' => false, 'message' => 'Opération introuvable dans OPS'], 404);
            }
            $row = (array) $row;

            DB::beginTransaction();

            // Résoudre / créer le client
            $clientNom = $row['client_nom'] ?? $row['client'] ?? 'Client OPS';
            $client = Client::firstOrCreate(
                ['nom' => $clientNom],
                ['code' => strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $clientNom) ?: 'CLI', 0, 3)) . rand(100, 999)]
            );

            // Créer l'OT en catégorie Opérations indépendantes
            $ordre = OrdreTravail::create([
                'numero' => OrdreTravail::genererNumero(),
                'client_id' => $client->id,
                'date' => $row['date_operation'] ?? $row['date'] ?? now(),
                'categorie' => DocumentCategory::INDEPENDANT,
                'statut' => 'brouillon',
                'notes' => $this->buildNotes($row),
            ]);

            // Ajouter une ligne simple si lignes_ordres existe et que des montants sont présents
            $montant = (float) ($row['montant_ht'] ?? $row['montant'] ?? $row['prix'] ?? 0);
            if ($montant > 0 && Schema::hasTable('lignes_ordres')) {
                try {
                    $ordre->lignes()->create([
                        'description' => $row['description'] ?? ($row['type'] ?? 'Opération OPS'),
                        'type_operation' => strtolower($row['type'] ?? 'autre'),
                        'quantite' => (float) ($row['quantite'] ?? 1),
                        'prix_unitaire' => $montant,
                        'montant_ht' => $montant,
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('OperationEnAttente.confirmer ligne fail', ['msg' => $e->getMessage()]);
                }
            }

            DB::table('operations_externes_tracking')->updateOrInsert(
                ['operation_id_externe' => $operationId],
                [
                    'statut' => 'converti',
                    'ordre_travail_id' => $ordre->id,
                    'traite_par' => Auth::id(),
                    'traite_at' => now(),
                    'snapshot' => json_encode($row, JSON_INVALID_UTF8_SUBSTITUTE),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Ordre de travail créé',
                'ordre' => ['id' => $ordre->id, 'numero' => $ordre->numero],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('OperationEnAttente.confirmer', ['id' => $operationId, 'message' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    // ─── Helpers ────────────────────────────────────────────

    private function resolveOpsTable(): ?string
    {
        try {
            $schema = Schema::connection('ops_ind');
            foreach (self::OPS_TABLES as $t) {
                if ($schema->hasTable($t)) return $t;
            }
        } catch (\Throwable) {}
        return null;
    }

    private function columns(string $table): array
    {
        try { return Schema::connection('ops_ind')->getColumnListing($table); }
        catch (\Throwable) { return []; }
    }

    private function pickColumn(array $cols, array $candidates): ?string
    {
        foreach ($candidates as $c) if (in_array($c, $cols, true)) return $c;
        return null;
    }

    private function fetchOpsRow(string $operationId): ?array
    {
        $table = $this->resolveOpsTable();
        if (!$table) return null;
        $idCol = $this->pickColumn($this->columns($table), ['id', 'operation_id']);
        if (!$idCol) return null;
        $row = DB::connection('ops_ind')->table($table)->where($idCol, $operationId)->first();
        return $row ? (array) $row : null;
    }

    private function formatRow(object $row, array $cols, string $idCol): array
    {
        $r = (array) $row;
        return [
            'id' => (string) $r[$idCol],
            'numero' => $r['numero'] ?? $r['reference'] ?? null,
            'type' => $r['type'] ?? $r['type_operation'] ?? null,
            'client_nom' => $r['client_nom'] ?? $r['client'] ?? null,
            'description' => $r['description'] ?? null,
            'point_depart' => $r['point_depart'] ?? null,
            'point_arrivee' => $r['point_arrivee'] ?? null,
            'date_operation' => $r['date_operation'] ?? $r['date'] ?? $r['created_at'] ?? null,
            'quantite' => isset($r['quantite']) ? (float) $r['quantite'] : null,
            'montant_ht' => isset($r['montant_ht']) ? (float) $r['montant_ht']
                : (isset($r['montant']) ? (float) $r['montant']
                : (isset($r['prix']) ? (float) $r['prix'] : null)),
            'raw' => $r,
        ];
    }

    private function buildNotes(array $row): string
    {
        $bits = [];
        if (!empty($row['numero'])) $bits[] = "Réf OPS : {$row['numero']}";
        if (!empty($row['description'])) $bits[] = $row['description'];
        if (!empty($row['point_depart']) || !empty($row['point_arrivee'])) {
            $bits[] = trim(($row['point_depart'] ?? '?') . ' → ' . ($row['point_arrivee'] ?? '?'));
        }
        return implode(" — ", $bits) ?: 'Importé depuis OPS';
    }

    private function emptyMeta(): array
    {
        return ['current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0];
    }
}
