<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Logistiga OPS Integration
    |--------------------------------------------------------------------------
    |
    | Configuration pour la synchronisation bidirectionnelle avec l'application
    | Logistiga OPS (suivi transport et conteneurs)
    |
    | FLUX:
    | - Facturation → OPS: Envoi des OT conteneurs via LOGISTIGA_OPS_API_KEY
    | - OPS → Facturation: Réception des conteneurs traités via LOGISTIGA_OPS_WEBHOOK_KEY
    |
    */

    'logistiga_ops' => [
        // URL de base de l'API Logistiga OPS
        'url' => env('LOGISTIGA_OPS_API_URL', 'https://suivitc.logistiga.com/backend/api'),
        
        // API Key pour ENVOYER vers Logistiga OPS (ordres de travail)
        'api_key' => env('LOGISTIGA_OPS_API_KEY'),
        
        // API Key pour RECEVOIR depuis Logistiga OPS (conteneurs traités)
        'webhook_key' => env('LOGISTIGA_OPS_WEBHOOK_KEY'),
        
        // Timeout en secondes pour les requêtes HTTP
        'timeout' => env('LOGISTIGA_OPS_TIMEOUT', 30),
        
        // Activer/désactiver la synchronisation automatique
        'sync_enabled' => env('LOGISTIGA_OPS_SYNC_ENABLED', true),
    ],

];
