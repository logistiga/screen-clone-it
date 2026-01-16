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
        // =============================================
        // RATE LIMITERS - Configuration centralisée
        // =============================================

        // 1. Rate limiter général API (60 req/min par user ou IP)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // 2. Login - STRICT (5/min par email+IP) - Protection brute force
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

        // 3. Reset password - TRÈS STRICT (3/min par email+IP)
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

        // 4. Exports - MODÉRÉ (20/min par user) - Prévenir abus téléchargement
        RateLimiter::for('exports', function (Request $request) {
            return Limit::perMinute(20)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Trop d\'exports demandés. Veuillez patienter avant de réessayer.',
                        'error' => 'too_many_exports',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });

        // 5. Dashboard/Stats - MODÉRÉ (30/min par user) - Requêtes potentiellement lourdes
        RateLimiter::for('dashboard', function (Request $request) {
            return Limit::perMinute(30)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Trop de requêtes dashboard. Veuillez patienter.',
                        'error' => 'too_many_requests',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });

        // 6. Reporting - STRICT (15/min par user) - Requêtes très lourdes en base
        RateLimiter::for('reporting', function (Request $request) {
            return Limit::perMinute(15)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Trop de requêtes de reporting. Ces calculs sont intensifs, veuillez patienter.',
                        'error' => 'too_many_requests',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });

        // 7. Stats globales - MODÉRÉ (20/min par user)
        RateLimiter::for('stats', function (Request $request) {
            return Limit::perMinute(20)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Trop de requêtes statistiques. Veuillez patienter.',
                        'error' => 'too_many_requests',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });

        // 8. Routes sensibles génériques (10/min par user)
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

        // 9. Création/Modification (30/min) - Empêcher spam de création
        RateLimiter::for('mutations', function (Request $request) {
            return Limit::perMinute(30)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Trop de modifications. Veuillez patienter.',
                        'error' => 'too_many_requests',
                        'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                    ], 429, $headers);
                });
        });
    }
}
