<?php

namespace App\Console\Commands;

use App\Models\Audit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class NettoyerAnciennesEntreesAudit extends Command
{
    protected $signature = 'audit:nettoyer {--jours=365 : Nombre de jours à conserver}';
    protected $description = 'Supprimer les anciennes entrées d\'audit';

    public function handle(): int
    {
        $jours = $this->option('jours');
        $this->info("Nettoyage des entrées d'audit de plus de {$jours} jours...");

        $dateLimit = now()->subDays($jours);

        $deleted = Audit::where('created_at', '<', $dateLimit)->delete();

        $this->info("Entrées d'audit supprimées: {$deleted}");
        Log::info("Nettoyage audit: {$deleted} entrées supprimées (> {$jours} jours)");

        return Command::SUCCESS;
    }
}
