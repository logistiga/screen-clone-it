<?php

namespace App\Console\Commands;

use App\Models\Devis;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class VerifierDevisExpires extends Command
{
    protected $signature = 'devis:verifier-expires';
    protected $description = 'Mettre à jour le statut des devis expirés';

    public function handle(): int
    {
        $this->info('Vérification des devis expirés...');

        $devisExpires = Devis::where('statut', 'envoye')
            ->where('date_validite', '<', now())
            ->update(['statut' => 'expire']);

        $this->info("Devis marqués comme expirés: {$devisExpires}");
        Log::info("Devis expirés mis à jour: {$devisExpires}");

        return Command::SUCCESS;
    }
}
