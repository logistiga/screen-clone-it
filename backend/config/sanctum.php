<?php

use Illuminate\Cookie\Middleware\EncryptCookies;

return [

    /*
    |--------------------------------------------------------------------------
    | Routes
    |--------------------------------------------------------------------------
    */

    'routes' => true,

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Includes Lovable preview/published domains
    | and production domain.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s,%s%s',
        // Développement local
        'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1',
        // Lovable preview & published + production
        'id-preview--60f20667-59d2-4f14-ba17-f1acde63f098.lovable.app,'
        . '60f20667-59d2-4f14-ba17-f1acde63f098.lovableproject.com,'
        . 'screen-clone-it.lovable.app,'
        . 'facturation.logistiga.pro,'
        . 'facturation.logistiga.com',
        // APP_URL host
        env('APP_URL') ? ',' . parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | Recommended: 10080 minutes = 7 days (avec refresh automatique côté frontend)
    | Le middleware SessionActivityTracker gère aussi l'idle timeout (60 min)
    |
    */

    'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 10080), // 7 jours par défaut

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];
