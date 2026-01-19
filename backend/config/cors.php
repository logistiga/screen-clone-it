<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | SECURITY: CORS is configured to restrict origins in production.
    | Set CORS_ALLOWED_ORIGINS in your .env file with your specific domains.
    |
    | IMPORTANT: supports_credentials=true => allowed_origins ne peut pas être '*'
    |
    */

    // Routes qui acceptent CORS (y compris sanctum/csrf-cookie pour l'auth SPA)
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'backend/api/*',
        'backend/sanctum/csrf-cookie',
        'backend/public/api/*',
        'backend/public/sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // SECURITY: Origines explicites (pas de '*' car supports_credentials=true)
    'allowed_origins' => (function () {
        // Origines par défaut toujours autorisées
        $defaultOrigins = [
            // Production
            'https://facturation.logistiga.com',
            'http://facturation.logistiga.com',

            // Lovable (preview + published)
            'https://id-preview--60f20667-59d2-4f14-ba17-f1acde63f098.lovable.app',
            'https://60f20667-59d2-4f14-ba17-f1acde63f098.lovableproject.com',
            'https://screen-clone-it.lovable.app',
        ];
        
        $raw = (string) env('CORS_ALLOWED_ORIGINS', '');
        
        if (empty(trim($raw))) {
            return $defaultOrigins;
        }
        
        $envOrigins = array_values(array_filter(array_map('trim', explode(',', $raw))));
        return array_unique(array_merge($defaultOrigins, $envOrigins));
    })(),

    // Patterns pour les URLs preview dynamiques
    'allowed_origins_patterns' => (function () {
        $defaultPatterns = [
            '#^https://.*\.lovableproject\.com$#',
            '#^https://id-preview--.*\.lovable\.app$#',
            '#^https://.*\.lovable\.app$#',
        ];

        $raw = (string) env('CORS_ALLOWED_ORIGINS_PATTERNS', '');
        $envPatterns = array_values(array_filter(array_map('trim', explode(',', $raw))));

        return array_values(array_unique(array_merge($defaultPatterns, $envPatterns)));
    })(),

    // Headers autorisés (incluant X-XSRF-TOKEN pour Sanctum)
    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'X-XSRF-TOKEN',
        'Accept',
        'Origin',
        'Authorization',
    ],

    'exposed_headers' => [],

    // Cache preflight pour 24h
    'max_age' => 86400,

    // IMPORTANT: true pour les cookies HttpOnly (Sanctum SPA)
    'supports_credentials' => true,
];
