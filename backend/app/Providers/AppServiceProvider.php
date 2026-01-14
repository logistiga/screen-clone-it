<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use App\Services\PaiementService;
use App\Services\NoteDebutService;
use App\Services\CaisseService;
use App\Services\AnnulationService;
use App\Services\ReportingService;
use App\Services\ExportService;
use App\Services\NotificationService;

// Services spécialisés par type - Devis
use App\Services\Devis\DevisConteneursService;
use App\Services\Devis\DevisConventionnelService;
use App\Services\Devis\DevisIndependantService;
use App\Services\Devis\DevisServiceFactory;

// Services spécialisés par type - OrdreTravail
use App\Services\OrdreTravail\OrdreConteneursService;
use App\Services\OrdreTravail\OrdreConventionnelService;
use App\Services\OrdreTravail\OrdreIndependantService;
use App\Services\OrdreTravail\OrdreServiceFactory;

// Services spécialisés par type - Facture
use App\Services\Facture\FactureConteneursService;
use App\Services\Facture\FactureConventionnelService;
use App\Services\Facture\FactureIndependantService;
use App\Services\Facture\FactureServiceFactory;

// Services spécialisés par type d'opération indépendante
use App\Services\OperationsIndependantes\LocationService;
use App\Services\OperationsIndependantes\TransportService;
use App\Services\OperationsIndependantes\ManutentionService;
use App\Services\OperationsIndependantes\DoubleRelevageService;
use App\Services\OperationsIndependantes\StockageService;
use App\Services\OperationsIndependantes\OperationIndependanteFactory;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // === Services Opérations Indépendantes (par type) ===
        $this->app->singleton(LocationService::class);
        $this->app->singleton(TransportService::class);
        $this->app->singleton(ManutentionService::class);
        $this->app->singleton(DoubleRelevageService::class);
        $this->app->singleton(StockageService::class);
        $this->app->singleton(OperationIndependanteFactory::class);

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
        // Rate limiter général API
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiter strict pour login (5 tentatives par minute)
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->input('email') . '|' . $request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = $headers['Retry-After'] ?? 60;
                    return response()->json([
                        'message' => "Trop de tentatives de connexion. Réessayez dans {$retryAfter} secondes.",
                        'error' => 'too_many_attempts',
                        'retry_after' => (int) $retryAfter,
                    ], 429, $headers);
                });
        });

        // Rate limiter pour reset password (3 tentatives par minute)
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(3)
                ->by($request->input('email') . '|' . $request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = $headers['Retry-After'] ?? 60;
                    return response()->json([
                        'message' => "Trop de demandes de réinitialisation. Réessayez dans {$retryAfter} secondes.",
                        'error' => 'too_many_attempts',
                        'retry_after' => (int) $retryAfter,
                    ], 429, $headers);
                });
        });

        // Rate limiter pour les routes sensibles (10 par minute)
        RateLimiter::for('sensitive', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Trop de requêtes. Veuillez patienter.',
                        'error' => 'too_many_requests',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });
    }
}
