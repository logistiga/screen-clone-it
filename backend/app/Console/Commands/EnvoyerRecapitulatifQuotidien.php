<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use Illuminate\Console\Command;

class EnvoyerRecapitulatifQuotidien extends Command
{
    protected $signature = 'notifications:recapitulatif-quotidien';
    protected $description = 'Envoyer le récapitulatif quotidien aux administrateurs';

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle(): int
    {
        $this->info('Envoi du récapitulatif quotidien...');

        $success = $this->notificationService->envoyerRecapitulatifQuotidien();

        if ($success) {
            $this->info('Récapitulatif quotidien envoyé avec succès.');
            return Command::SUCCESS;
        }

        $this->error('Erreur lors de l\'envoi du récapitulatif quotidien.');
        return Command::FAILURE;
    }
}
