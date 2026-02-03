<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
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
        // car elles utilisent le header X-XSRF-TOKEN (cookie) ou Bearer token
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'backend/api/*',
            'backend/public/api/*',
        ]);

        // Middlewares globaux sur TOUTES les routes API
        $middleware->api([
            // 1. CORS - DOIT être en PREMIER pour traiter les OPTIONS preflight avant tout
            \Illuminate\Http\Middleware\HandleCors::class,
            
            // 2. Sanctum Stateful - auth SPA avec cookies
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            
            // 3. Security Headers
            \App\Http\Middleware\SecurityHeaders::class,
            
            // 4. Rate Limiting global (60 req/min par défaut)
            'throttle:api',
            
            // 5. Binding des paramètres de route
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            
            // 6. Logging sécurité (auth, exports, opérations sensibles)
            \App\Http\Middleware\SecurityAuditLog::class,
            
            // 7. Tracking d'activité de session (idle timeout)
            \App\Http\Middleware\SessionActivityTracker::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Retourner JSON 401 au lieu de rediriger vers 'login' pour les API
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Non authentifié. Veuillez vous connecter.',
                    'error' => 'Unauthenticated'
                ], 401);
            }
        });
    })->create();
