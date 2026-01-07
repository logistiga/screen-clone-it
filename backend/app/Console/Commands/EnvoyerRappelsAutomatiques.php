<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use Illuminate\Console\Command;

class EnvoyerRappelsAutomatiques extends Command
{
    protected $signature = 'notifications:rappels-automatiques';
    protected $description = 'Envoyer les rappels automatiques pour les factures en retard';

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle(): int
    {
        $this->info('Envoi des rappels automatiques...');

        $resultats = $this->notificationService->envoyerRappelsAutomatiques();

        $this->info("Rappels envoyés: {$resultats['envoyes']}");
        $this->info("Échecs: {$resultats['echecs']}");

        if (!empty($resultats['details'])) {
            $this->table(
                ['Facture', 'Client', 'Rappel N°', 'Statut'],
                array_map(function ($detail) {
                    return [
                        $detail['facture'],
                        $detail['client'],
                        $detail['rappel'],
                        $detail['statut'],
                    ];
                }, $resultats['details'])
            );
        }

        return Command::SUCCESS;
    }
}
