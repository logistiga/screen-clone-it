<?php

namespace App\Console\Commands;

use App\Models\CreditBancaire;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class VerifierEcheancesCredits extends Command
{
    protected $signature = 'credits:verifier-echeances';
    protected $description = 'Vérifier les échéances de crédits et envoyer des alertes';

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle(): int
    {
        $this->info('Vérification des échéances de crédits...');

        $alertesEnvoyees = 0;

        // Crédits avec échéance dans 30 jours
        $credits30j = CreditBancaire::where('statut', 'actif')
            ->whereHas('echeances', function ($query) {
                $query->where('statut', 'en_attente')
                    ->whereBetween('date_echeance', [now()->addDays(25), now()->addDays(30)]);
            })
            ->get();

        foreach ($credits30j as $credit) {
            if ($this->notificationService->envoyerAlerteEcheanceCredit($credit, 30)) {
                $alertesEnvoyees++;
                $this->line("Alerte 30j envoyée pour crédit {$credit->reference}");
            }
        }

        // Crédits avec échéance dans 7 jours
        $credits7j = CreditBancaire::where('statut', 'actif')
            ->whereHas('echeances', function ($query) {
                $query->where('statut', 'en_attente')
                    ->whereBetween('date_echeance', [now()->addDays(5), now()->addDays(7)]);
            })
            ->get();

        foreach ($credits7j as $credit) {
            if ($this->notificationService->envoyerAlerteEcheanceCredit($credit, 7)) {
                $alertesEnvoyees++;
                $this->line("Alerte 7j envoyée pour crédit {$credit->reference}");
            }
        }

        // Crédits avec échéance demain
        $credits1j = CreditBancaire::where('statut', 'actif')
            ->whereHas('echeances', function ($query) {
                $query->where('statut', 'en_attente')
                    ->whereDate('date_echeance', now()->addDay());
            })
            ->get();

        foreach ($credits1j as $credit) {
            if ($this->notificationService->envoyerAlerteEcheanceCredit($credit, 1)) {
                $alertesEnvoyees++;
                $this->line("Alerte 1j envoyée pour crédit {$credit->reference}");
            }
        }

        $this->info("Total alertes envoyées: {$alertesEnvoyees}");

        return Command::SUCCESS;
    }
}
