<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\DevisService;
use App\Services\FactureService;
use App\Services\OrdreTravailService;
use App\Services\PaiementService;
use App\Services\NoteDebutService;
use App\Services\CaisseService;
use App\Services\AnnulationService;
use App\Services\ReportingService;
use App\Services\ExportService;
use App\Services\NotificationService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Services de base sans dépendances
        $this->app->singleton(DevisService::class);
        $this->app->singleton(FactureService::class);
        $this->app->singleton(OrdreTravailService::class);
        $this->app->singleton(NoteDebutService::class);
        $this->app->singleton(CaisseService::class);
        $this->app->singleton(AnnulationService::class);
        $this->app->singleton(ReportingService::class);
        $this->app->singleton(NotificationService::class);

        // PaiementService a des dépendances
        $this->app->singleton(PaiementService::class, function ($app) {
            return new PaiementService(
                $app->make(FactureService::class),
                $app->make(OrdreTravailService::class)
            );
        });

        // ExportService a des dépendances
        $this->app->singleton(ExportService::class, function ($app) {
            return new ExportService(
                $app->make(ReportingService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
