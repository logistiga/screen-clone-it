<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | - Pour valider rapidement, vous pouvez laisser CORS_ALLOWED_ORIGINS='*'.
    | - Ensuite, restreignez à vos domaines (ex: https://*.lovableproject.com).
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Ex: CORS_ALLOWED_ORIGINS="https://app.mondomaine.com,https://preview.mondomaine.com"
    // Ou pour autoriser tout (dev): CORS_ALLOWED_ORIGINS="*"
    'allowed_origins' => (function () {
        $raw = (string) env('CORS_ALLOWED_ORIGINS', '*');
        $parts = array_values(array_filter(array_map('trim', explode(',', $raw))));
        return $parts ?: ['*'];
    })(),

    // Ex: CORS_ALLOWED_ORIGINS_PATTERNS="^https:\\/\\/.*\\.lovableproject\\.com$"
    'allowed_origins_patterns' => (function () {
        $raw = (string) env('CORS_ALLOWED_ORIGINS_PATTERNS', '');
        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    })(),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Bearer token => pas besoin de credentials. Mettez true seulement si vous utilisez des cookies cross-site.
    'supports_credentials' => false,
];
