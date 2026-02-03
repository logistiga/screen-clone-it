<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes - Tâches Planifiées
|--------------------------------------------------------------------------
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Planification des tâches (Scheduler)
|--------------------------------------------------------------------------
| 
| Pour exécuter le scheduler, ajoutez cette entrée cron sur votre serveur:
| * * * * * cd /chemin-vers-projet && php artisan schedule:run >> /dev/null 2>&1
|
*/

// Rappels automatiques - tous les jours à 9h
Schedule::command('notifications:rappels-automatiques')
    ->dailyAt('09:00')
    ->timezone('Africa/Dakar')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/scheduler.log'));

// Récapitulatif quotidien - tous les jours à 18h
Schedule::command('notifications:recapitulatif-quotidien')
    ->dailyAt('18:00')
    ->timezone('Africa/Dakar')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/scheduler.log'));

// Vérification des échéances de crédits - tous les jours à 8h
Schedule::command('credits:verifier-echeances')
    ->dailyAt('08:00')
    ->timezone('Africa/Dakar')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/scheduler.log'));

// Vérification des devis expirés - tous les jours à minuit
Schedule::command('devis:verifier-expires')
    ->dailyAt('00:00')
    ->timezone('Africa/Dakar')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/scheduler.log'));

// Calcul des retards de paiement - tous les jours à 1h
Schedule::command('factures:calculer-retards')
    ->dailyAt('01:00')
    ->timezone('Africa/Dakar')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/scheduler.log'));

// Nettoyage des anciennes entrées d'audit - tous les dimanches à 3h
Schedule::command('audit:nettoyer --jours=365')
    ->weeklyOn(0, '03:00')
    ->timezone('Africa/Dakar')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/scheduler.log'));
