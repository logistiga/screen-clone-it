<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Synchronisation unidirectionnelle : Facturation → OPS
 * 
 * Lit directement la base de données Facturation (connexion READ ONLY)
 * et met à jour les tables locales OPS via upsert.
 */
class SyncFromFacturation extends Command
{
    protected $signature = 'sync:from-facturation 
                            {--table= : Synchroniser une table spécifique}
                            {--force : Forcer la resynchronisation complète}
                            {--dry-run : Simuler sans modifier}
                            {--status : Afficher l\'état de la dernière synchronisation}';

    protected $description = 'Synchronise les données depuis la base Facturation (lecture directe)';

    /**
     * Configuration des tables à synchroniser
     * Format: 'table_source' => [
     *     'target' => 'table_cible',
     *     'columns' => [...colonnes à copier...],
     *     'key' => 'colonne_unique',
     * ]
     */
    protected array $tables = [
        'clients' => [
            'target' => 'clients',
            'key' => 'id',
            'columns' => [
                'id', 'code', 'nom', 'email', 'telephone', 'adresse',
                'ville', 'pays', 'ninea', 'registre_commerce', 'type',
                'statut', 'notes', 'created_at', 'updated_at'
            ],
        ],
        'transitaires' => [
            'target' => 'transitaires',
            'key' => 'id',
            'columns' => [
                'id', 'code', 'nom', 'email', 'telephone', 'adresse',
                'ville', 'contact_nom', 'contact_telephone', 'statut',
                'notes', 'created_at', 'updated_at'
            ],
        ],
        'armateurs' => [
            'target' => 'armateurs',
            'key' => 'id',
            'columns' => [
                'id', 'code', 'nom', 'pays', 'statut',
                'created_at', 'updated_at'
            ],
        ],
        'representants' => [
            'target' => 'representants',
            'key' => 'id',
            'columns' => [
                'id', 'code', 'nom', 'telephone', 'email', 'statut',
                'created_at', 'updated_at'
            ],
        ],
        'services' => [
            'target' => 'services',
            'key' => 'id',
            'columns' => [
                'id', 'code', 'nom', 'description', 'prix_unitaire',
                'unite', 'categorie', 'statut', 'created_at', 'updated_at'
            ],
        ],
    ];

    protected Carbon $syncStartTime;
    protected array $stats = [];
    protected string $logChannel = 'sync-facturation';

    public function handle(): int
    {
        $this->syncStartTime = now();

        // Mode status
        if ($this->option('status')) {
            return $this->showStatus();
        }

        // Vérifier la connexion à Facturation
        if (!$this->checkFacturationConnection()) {
            return Command::FAILURE;
        }

        $this->info('🔄 Démarrage synchronisation Facturation → OPS');
        $this->log('info', 'Synchronisation démarrée', [
            'force' => $this->option('force'),
            'dry_run' => $this->option('dry-run'),
            'table' => $this->option('table'),
        ]);

        $tableFilter = $this->option('table');
        $tablesToSync = $tableFilter 
            ? [$tableFilter => $this->tables[$tableFilter] ?? null]
            : $this->tables;

        if ($tableFilter && !isset($this->tables[$tableFilter])) {
            $this->error("Table inconnue: {$tableFilter}");
            $this->line('Tables disponibles: ' . implode(', ', array_keys($this->tables)));
            return Command::FAILURE;
        }

        $totalInserted = 0;
        $totalUpdated = 0;
        $totalErrors = 0;

        foreach ($tablesToSync as $sourceTable => $config) {
            if (!$config) continue;

            $result = $this->syncTable($sourceTable, $config);
            
            $this->stats[$sourceTable] = $result;
            $totalInserted += $result['inserted'];
            $totalUpdated += $result['updated'];
            $totalErrors += $result['errors'];
        }

        // Enregistrer le timestamp de dernière synchronisation
        if (!$this->option('dry-run')) {
            $this->saveLastSyncTimestamp();
        }

        // Résumé
        $this->newLine();
        $this->info('✅ Synchronisation terminée');
        $this->table(
            ['Table', 'Insérés', 'Mis à jour', 'Erreurs'],
            collect($this->stats)->map(fn($s, $t) => [
                $t, $s['inserted'], $s['updated'], $s['errors']
            ])->values()->toArray()
        );

        $duration = now()->diffInSeconds($this->syncStartTime);
        $this->line("⏱️  Durée: {$duration} secondes");

        $this->log('info', 'Synchronisation terminée', [
            'duration_seconds' => $duration,
            'total_inserted' => $totalInserted,
            'total_updated' => $totalUpdated,
            'total_errors' => $totalErrors,
        ]);

        return $totalErrors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    protected function syncTable(string $sourceTable, array $config): array
    {
        $this->line("📋 Synchronisation: {$sourceTable}");

        $result = ['inserted' => 0, 'updated' => 0, 'errors' => 0, 'skipped' => 0];

        try {
            $query = DB::connection('facturation')
                ->table($sourceTable)
                ->select($config['columns']);

            // Synchronisation incrémentale (sauf si --force)
            if (!$this->option('force')) {
                $lastSync = $this->getLastSyncTimestamp($sourceTable);
                if ($lastSync) {
                    $query->where('updated_at', '>', $lastSync);
                    $this->line("   ↳ Incrémental depuis: {$lastSync}");
                }
            }

            $records = $query->get();
            $count = $records->count();

            if ($count === 0) {
                $this->line("   ↳ Aucune modification");
                return $result;
            }

            $this->line("   ↳ {$count} enregistrement(s) à traiter");

            $bar = $this->output->createProgressBar($count);
            $bar->start();

            foreach ($records as $record) {
                try {
                    $data = (array) $record;

                    if ($this->option('dry-run')) {
                        $result['updated']++;
                    } else {
                        // Upsert : insert ou update si existe
                        $exists = DB::table($config['target'])
                            ->where($config['key'], $data[$config['key']])
                            ->exists();

                        if ($exists) {
                            DB::table($config['target'])
                                ->where($config['key'], $data[$config['key']])
                                ->update($data);
                            $result['updated']++;
                        } else {
                            DB::table($config['target'])->insert($data);
                            $result['inserted']++;
                        }
                    }
                } catch (\Exception $e) {
                    $result['errors']++;
                    $this->log('error', "Erreur sync {$sourceTable}", [
                        'record_id' => $record->{$config['key']} ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);
                }

                $bar->advance();
            }

            $bar->finish();
            $this->newLine();

            // Afficher résultat
            $status = $result['errors'] > 0 ? '⚠️' : '✓';
            $this->line("   {$status} Insérés: {$result['inserted']}, Mis à jour: {$result['updated']}, Erreurs: {$result['errors']}");

        } catch (\Exception $e) {
            $this->error("   ✗ Erreur: " . $e->getMessage());
            $result['errors']++;
            $this->log('error', "Erreur table {$sourceTable}", [
                'error' => $e->getMessage(),
            ]);
        }

        return $result;
    }

    protected function checkFacturationConnection(): bool
    {
        try {
            DB::connection('facturation')->getPdo();
            $this->info('✓ Connexion à la base Facturation OK');
            return true;
        } catch (\Exception $e) {
            $this->error('✗ Impossible de se connecter à la base Facturation');
            $this->error('  ' . $e->getMessage());
            $this->newLine();
            $this->warn('Vérifiez la configuration dans .env:');
            $this->line('  FAC_DB_HOST, FAC_DB_DATABASE, FAC_DB_USERNAME, FAC_DB_PASSWORD');
            
            $this->log('error', 'Échec connexion Facturation', [
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    protected function getLastSyncTimestamp(string $table): ?string
    {
        $path = storage_path("app/sync-timestamps/{$table}.txt");
        
        if (file_exists($path)) {
            return trim(file_get_contents($path));
        }
        
        return null;
    }

    protected function saveLastSyncTimestamp(): void
    {
        $dir = storage_path('app/sync-timestamps');
        
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        foreach (array_keys($this->stats) as $table) {
            file_put_contents(
                "{$dir}/{$table}.txt",
                $this->syncStartTime->toDateTimeString()
            );
        }
    }

    protected function showStatus(): int
    {
        $this->info('📊 État de la synchronisation Facturation → OPS');
        $this->newLine();

        $data = [];
        foreach (array_keys($this->tables) as $table) {
            $lastSync = $this->getLastSyncTimestamp($table);
            $localCount = DB::table($table)->count();
            
            $data[] = [
                $table,
                $lastSync ?? 'Jamais',
                $localCount,
            ];
        }

        $this->table(['Table', 'Dernière sync', 'Enregistrements locaux'], $data);

        // Vérifier connexion
        $this->newLine();
        $this->checkFacturationConnection();

        return Command::SUCCESS;
    }

    protected function log(string $level, string $message, array $context = []): void
    {
        $logFile = storage_path('logs/sync-facturation.log');
        $timestamp = now()->toDateTimeString();
        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        
        file_put_contents(
            $logFile,
            "[{$timestamp}] {$level}: {$message}{$contextStr}" . PHP_EOL,
            FILE_APPEND
        );
    }
}
