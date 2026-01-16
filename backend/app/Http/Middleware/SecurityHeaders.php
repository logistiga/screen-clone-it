<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de sécurité HTTP Headers
 * Applique les headers de sécurité recommandés sur toutes les réponses API
 */
class SecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Protection contre le clickjacking
        $response->headers->set('X-Frame-Options', 'DENY');

        // Protection XSS (navigateurs modernes)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Empêcher le MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Referrer Policy - limiter les informations envoyées
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy - désactiver les fonctionnalités sensibles
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Content Security Policy pour API (strict)
        $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

        // Strict Transport Security (HSTS) - uniquement en production
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Cache Control pour données sensibles
        if ($this->isSensitiveRoute($request)) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
        }

        return $response;
    }

    /**
     * Vérifie si la route est sensible (auth, exports, données utilisateur)
     */
    protected function isSensitiveRoute(Request $request): bool
    {
        $sensitivePatterns = [
            'api/auth/*',
            'api/user',
            'api/users/*',
            'api/exports/*',
            'api/roles/*',
            'api/permissions/*',
            'api/audit/*',
            'api/configuration/*',
        ];

        foreach ($sensitivePatterns as $pattern) {
            if ($request->is($pattern)) {
                return true;
            }
        }

        return false;
    }
}
