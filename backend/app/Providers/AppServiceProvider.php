<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\DevisService;
use App\Services\FactureService;
use App\Services\OrdreTravailService;
use App\Services\PaiementService;
use App\Services\NoteDebutService;
use App\Services\CaisseService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Enregistrer les services comme singletons
        $this->app->singleton(DevisService::class);
        $this->app->singleton(FactureService::class);
        $this->app->singleton(OrdreTravailService::class);
        $this->app->singleton(NoteDebutService::class);
        $this->app->singleton(CaisseService::class);

        // PaiementService a des dépendances
        $this->app->singleton(PaiementService::class, function ($app) {
            return new PaiementService(
                $app->make(FactureService::class),
                $app->make(OrdreTravailService::class)
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
