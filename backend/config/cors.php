<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | SECURITY: CORS is configured to restrict origins in production.
    | Set CORS_ALLOWED_ORIGINS in your .env file with your specific domains.
    | Example: CORS_ALLOWED_ORIGINS="https://app.yourdomain.com,https://preview.yourdomain.com"
    |
    | For Lovable projects, use patterns to allow preview URLs:
    | CORS_ALLOWED_ORIGINS_PATTERNS="^https:\\/\\/.*\\.lovableproject\\.com$"
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // SECURITY: No longer defaults to '*'. Must be explicitly configured.
    // In development, set CORS_ALLOWED_ORIGINS="*" if needed.
    // In production, always specify exact domains.
    'allowed_origins' => (function () {
        // Origines par défaut toujours autorisées
        $defaultOrigins = [
            'https://facturation.logistiga.com',
            'http://facturation.logistiga.com',
        ];
        
        $raw = (string) env('CORS_ALLOWED_ORIGINS', '');
        
        if (empty(trim($raw))) {
            return $defaultOrigins;
        }
        
        $envOrigins = array_values(array_filter(array_map('trim', explode(',', $raw))));
        return array_unique(array_merge($defaultOrigins, $envOrigins));
    })(),

    // For pattern-based matching (e.g., Lovable preview URLs)
    // Example: CORS_ALLOWED_ORIGINS_PATTERNS="^https:\\/\\/.*\\.lovableproject\\.com$"
    'allowed_origins_patterns' => (function () {
        $raw = (string) env('CORS_ALLOWED_ORIGINS_PATTERNS', '');
        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    })(),

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // HttpOnly cookies pour l'authentification - DOIT être true
    'supports_credentials' => true,
];
