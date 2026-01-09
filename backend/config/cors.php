<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | API appelée depuis un domaine différent (ex: *.lovableproject.com).
    | On autorise les requêtes cross-origin pour /api/*.
    |
    | IMPORTANT: si vous passez à une auth par cookies (credentials),
    | remplacez '*' par une liste d'origines explicites et mettez
    | 'supports_credentials' => true.
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
