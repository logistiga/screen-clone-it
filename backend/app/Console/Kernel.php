<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Rappels automatiques - tous les jours à 9h
        $schedule->command('notifications:rappels-automatiques')
            ->dailyAt('09:00')
            ->timezone('Africa/Dakar')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/scheduler.log'));

        // Récapitulatif quotidien - tous les jours à 18h
        $schedule->command('notifications:recapitulatif-quotidien')
            ->dailyAt('18:00')
            ->timezone('Africa/Dakar')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/scheduler.log'));

        // Vérification des échéances de crédits - tous les jours à 8h
        $schedule->command('credits:verifier-echeances')
            ->dailyAt('08:00')
            ->timezone('Africa/Dakar')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/scheduler.log'));

        // Vérification des devis expirés - tous les jours à minuit
        $schedule->command('devis:verifier-expires')
            ->dailyAt('00:00')
            ->timezone('Africa/Dakar')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/scheduler.log'));

        // Calcul des retards de paiement - tous les jours à 1h
        $schedule->command('factures:calculer-retards')
            ->dailyAt('01:00')
            ->timezone('Africa/Dakar')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/scheduler.log'));

        // Nettoyage des anciennes entrées d'audit - tous les dimanches à 3h
        $schedule->command('audit:nettoyer --jours=365')
            ->weeklyOn(0, '03:00')
            ->timezone('Africa/Dakar')
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/scheduler.log'));
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
