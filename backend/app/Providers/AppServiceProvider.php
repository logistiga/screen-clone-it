<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use App\Services\DevisService;
use App\Services\PaiementService;
use App\Services\NoteDebutService;
use App\Services\CaisseService;
use App\Services\AnnulationService;
use App\Services\ReportingService;
use App\Services\ExportService;
use App\Services\NotificationService;

// Services spécialisés par type
use App\Services\Devis\DevisConteneursService;
use App\Services\Devis\DevisConventionnelService;
use App\Services\Devis\DevisIndependantService;
use App\Services\Devis\DevisServiceFactory;
use App\Services\OrdreTravail\OrdreConteneursService;
use App\Services\OrdreTravail\OrdreConventionnelService;
use App\Services\OrdreTravail\OrdreIndependantService;
use App\Services\OrdreTravail\OrdreServiceFactory;
use App\Services\Facture\FactureConteneursService;
use App\Services\Facture\FactureConventionnelService;
use App\Services\Facture\FactureIndependantService;
use App\Services\Facture\FactureServiceFactory;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // === Services Devis spécialisés par type ===
        $this->app->singleton(DevisConteneursService::class);
        $this->app->singleton(DevisConventionnelService::class);
        $this->app->singleton(DevisIndependantService::class);
        $this->app->singleton(DevisServiceFactory::class);
        
        // === Services OrdreTravail spécialisés par type ===
        $this->app->singleton(OrdreConteneursService::class);
        $this->app->singleton(OrdreConventionnelService::class);
        $this->app->singleton(OrdreIndependantService::class);
        $this->app->singleton(OrdreServiceFactory::class);
        
        // === Services Facture spécialisés par type ===
        $this->app->singleton(FactureConteneursService::class);
        $this->app->singleton(FactureConventionnelService::class);
        $this->app->singleton(FactureIndependantService::class);
        $this->app->singleton(FactureServiceFactory::class);
        
        // === Services utilitaires ===
        $this->app->singleton(DevisService::class);
        $this->app->singleton(NoteDebutService::class);
        $this->app->singleton(CaisseService::class);
        $this->app->singleton(AnnulationService::class);
        $this->app->singleton(ReportingService::class);
        $this->app->singleton(NotificationService::class);

        // PaiementService utilise les Factories
        $this->app->singleton(PaiementService::class, function ($app) {
            return new PaiementService(
                $app->make(FactureServiceFactory::class),
                $app->make(OrdreServiceFactory::class)
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
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
