<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware pour extraire le token du cookie HttpOnly
 * et l'ajouter à l'en-tête Authorization pour Sanctum
 */
class AuthenticateFromCookie
{
    private const TOKEN_COOKIE_NAME = 'auth_token';

    public function handle(Request $request, Closure $next): Response
    {
        // Si pas d'en-tête Authorization mais un cookie de token existe
        if (!$request->hasHeader('Authorization') && $request->hasCookie(self::TOKEN_COOKIE_NAME)) {
            $token = $request->cookie(self::TOKEN_COOKIE_NAME);
            
            if ($token) {
                // Ajouter le token à l'en-tête Authorization
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
