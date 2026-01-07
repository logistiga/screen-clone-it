<?php

namespace App\Console\Commands;

use App\Models\Facture;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CalculerRetardsPaiement extends Command
{
    protected $signature = 'factures:calculer-retards';
    protected $description = 'Calculer et mettre à jour les jours de retard des factures impayées';

    public function handle(): int
    {
        $this->info('Calcul des retards de paiement...');

        $facturesEnRetard = Facture::where('statut', '!=', 'paye')
            ->where('statut', '!=', 'annule')
            ->where('date_echeance', '<', now())
            ->get();

        $count = 0;
        foreach ($facturesEnRetard as $facture) {
            $joursRetard = now()->diffInDays($facture->date_echeance);
            $facture->update(['jours_retard' => $joursRetard]);
            $count++;
        }

        $this->info("Factures mises à jour: {$count}");
        Log::info("Retards de paiement calculés pour {$count} factures");

        return Command::SUCCESS;
    }
}
