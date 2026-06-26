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
    private const OPS_TABLES = ['operations', 'operations_independantes'];

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

            // Soft delete OPS
            if (in_array('deleted_at', $cols, true)) {
                $query->whereNull('deleted_at');
            }

            if (!empty($traitedIds)) {
                $query->whereNotIn($idCol, $traitedIds);
            }

            // Recherche
            if ($search = $request->input('search')) {
                $searchable = array_intersect($cols, [
                    'numero_operation', 'numero', 'reference',
                    'snapshot_client_name', 'client_nom', 'client',
                    'description_generale', 'description',
                    'type_marchandise', 'type',
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
            if (in_array('deleted_at', $cols, true)) $q->whereNull('deleted_at');
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
            $clientNom = $row['snapshot_client_name'] ?? $row['client_nom'] ?? $row['client'] ?? 'Client OPS';
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
            $montant = (float) ($row['total_transport_fcfa'] ?? $row['montant_ht'] ?? $row['montant'] ?? $row['prix'] ?? 0);
            $description = $row['description_generale'] ?? $row['description'] ?? $row['type_marchandise'] ?? $row['type'] ?? 'Opération OPS';
            if ($montant > 0 && Schema::hasTable('lignes_ordres')) {
                try {
                    $ordre->lignes()->create([
                        'description' => $description,
                        'type_operation' => strtolower($row['type_marchandise'] ?? $row['type'] ?? 'autre'),
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
        $get = function(array $candidates) use ($r) {
            foreach ($candidates as $c) {
                if (array_key_exists($c, $r) && $r[$c] !== null && $r[$c] !== '') return $r[$c];
            }
            return null;
        };
        $num = $get(['numero_operation', 'numero', 'reference', 'ref', 'code']);
        $type = $get(['type_marchandise', 'type', 'type_operation', 'nature', 'categorie']);
        $client = $get(['snapshot_client_name', 'client_nom', 'client', 'nom_client', 'raison_sociale']);
        $clientId = $get(['external_client_id', 'client_id']);
        $desc = $get(['description_generale', 'description', 'designation', 'libelle', 'objet', 'observation']);
        $depart = $get(['point_depart', 'depart', 'origine', 'lieu_depart']);
        $arrivee = $get(['point_arrivee', 'arrivee', 'destination', 'lieu_arrivee']);
        $date = $get(['date_operation', 'date', 'date_op', 'created_at']);
        $qte = $get(['quantite', 'qte', 'nb', 'nombre']);
        $mt = $get(['total_transport_fcfa', 'montant_ht', 'montant', 'prix', 'prix_ht', 'montant_total', 'total_ht']);
        $statut = $get(['statut', 'status', 'state']);

        return [
            'id' => (string) $r[$idCol],
            'numero' => $num,
            'type' => $type,
            'client_nom' => $client,
            'client_id_externe' => $clientId,
            'description' => $desc,
            'point_depart' => $depart,
            'point_arrivee' => $arrivee,
            'date_operation' => $date,
            'quantite' => $qte !== null ? (float) $qte : null,
            'montant_ht' => $mt !== null ? (float) $mt : null,
            'statut' => $statut,
            'raw' => $r,
        ];
    }

    private function buildNotes(array $row): string
    {
        $bits = [];
        $num = $row['numero_operation'] ?? $row['numero'] ?? null;
        if ($num) $bits[] = "Réf OPS : {$num}";
        $desc = $row['description_generale'] ?? $row['description'] ?? null;
        if ($desc) $bits[] = $desc;
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
