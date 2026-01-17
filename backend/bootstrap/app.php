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

        // Middlewares globaux sur TOUTES les routes API
        $middleware->api([
            // 1. Security Headers - appliqué en premier
            \App\Http\Middleware\SecurityHeaders::class,
            
            // 2. CORS - gestion des origines autorisées
            \Illuminate\Http\Middleware\HandleCors::class,
            
            // 3. Auth stateless via Bearer token (Sanctum personal access tokens)
            // (pas de cookies, pas de CSRF côté API)
            
            // 5. Rate Limiting global (60 req/min par défaut)
            'throttle:api',
            
            // 6. Binding des paramètres de route
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            
            // 7. Logging sécurité (auth, exports, opérations sensibles)
            \App\Http\Middleware\SecurityAuditLog::class,
            
            // 8. Tracking d'activité de session (idle timeout)
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
