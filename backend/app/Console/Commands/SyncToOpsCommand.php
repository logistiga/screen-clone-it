<?php

namespace App\Console\Commands;

use App\Models\Client;
use App\Models\Transitaire;
use App\Services\LogistigaApiService;
use Illuminate\Console\Command;

class SyncToOpsCommand extends Command
{
    protected $signature = 'logistiga:sync-to-ops {--type=all : clients|transitaires|all}';
    protected $description = 'Synchronise les référentiels vers Logistiga OPS';

    public function handle(LogistigaApiService $service): int
    {
        $type = $this->option('type');

        if (!$service->isSyncEnabled()) {
            $this->error('Synchronisation désactivée. Vérifiez LOGISTIGA_OPS_API_KEY dans votre .env');
            return Command::FAILURE;
        }

        $this->info('Démarrage de la synchronisation vers Logistiga OPS...');

        if (in_array($type, ['clients', 'all'])) {
            $this->syncClients($service);
        }

        if (in_array($type, ['transitaires', 'all'])) {
            $this->syncTransitaires($service);
        }

        $this->newLine();
        $this->info('✓ Synchronisation terminée !');
        return Command::SUCCESS;
    }

    protected function syncClients(LogistigaApiService $service): void
    {
        $clients = Client::all();
        $total = $clients->count();
        
        if ($total === 0) {
            $this->info('Aucun client à synchroniser.');
            return;
        }

        $this->newLine();
        $this->info("Synchronisation de {$total} clients...");
        $bar = $this->output->createProgressBar($total);

        $success = 0;
        $failed = 0;

        foreach ($clients as $client) {
            $result = $service->syncClient($client);
            
            if ($result['success'] ?? false) {
                $success++;
            } else {
                $failed++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("  → {$success}/{$total} clients synchronisés" . ($failed > 0 ? " ({$failed} échecs)" : ''));
    }

    protected function syncTransitaires(LogistigaApiService $service): void
    {
        $transitaires = Transitaire::all();
        $total = $transitaires->count();
        
        if ($total === 0) {
            $this->info('Aucun transitaire à synchroniser.');
            return;
        }

        $this->newLine();
        $this->info("Synchronisation de {$total} transitaires...");
        $bar = $this->output->createProgressBar($total);

        $success = 0;
        $failed = 0;

        foreach ($transitaires as $transitaire) {
            $result = $service->syncTransitaire($transitaire);
            
            if ($result['success'] ?? false) {
                $success++;
            } else {
                $failed++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("  → {$success}/{$total} transitaires synchronisés" . ($failed > 0 ? " ({$failed} échecs)" : ''));
    }
}
