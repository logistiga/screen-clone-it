<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Console\Scheduling\Schedule;

$builder = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    );

// IMPORTANT: La planification ne doit impacter que le runtime CLI (cron/artisan).
// En environnement HTTP, certains hébergeurs déclenchent des erreurs très tôt
// (avant le chargement de la config), ce qui peut casser toutes les routes.
if (PHP_SAPI === 'cli' || PHP_SAPI === 'phpdbg') {
    $builder = $builder->withSchedule(function (Schedule $schedule) {
        // Planification des tâches périodiques (Laravel 11+)
        $schedule->command('notifications:rappels-automatiques')
            ->dailyAt('09:00')
            ->timezone('Africa/Dakar');

        $schedule->command('credits:check-approvals')
            ->everyMinute();

        $schedule->command('paiements:check-delays')
            ->dailyAt('08:00')
            ->timezone('Africa/Dakar');
    });
}

return $builder
    ->withMiddleware(function (Middleware $middleware) {
        // Alias des middlewares personnalisés
        $middleware->alias([
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'role' => \App\Http\Middleware\CheckRole::class,
            'user.active' => \App\Http\Middleware\CheckUserActive::class,
            'audit' => \App\Http\Middleware\AuditLog::class,
            'security.headers' => \App\Http\Middleware\SecurityHeaders::class,
            'security.audit' => \App\Http\Middleware\SecurityAuditLog::class,
            'prevent.idor' => \App\Http\Middleware\PreventIDOR::class,
            'session.track' => \App\Http\Middleware\SessionActivityTracker::class,
        ]);

        // IMPORTANT: Sanctum SPA auth - Exclure les routes API de la validation CSRF
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'backend/api/*',
            'backend/public/api/*',
        ]);

        // Middlewares globaux sur TOUTES les routes API
        $middleware->api([
            \Illuminate\Http\Middleware\HandleCors::class,
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \App\Http\Middleware\SecurityHeaders::class,
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \App\Http\Middleware\SecurityAuditLog::class,
            \App\Http\Middleware\SessionActivityTracker::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Retourner JSON 401 au lieu de rediriger vers 'login' pour les API
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->is('*/api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Non authentifié. Veuillez vous connecter.',
                    'error' => 'Unauthenticated'
                ], 401);
            }
        });
    })->create();
