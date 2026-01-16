<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Hash Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default hash driver that will be used to hash
    | passwords for your application. By default, the Argon2id algorithm is
    | used; however, you remain free to modify this option if you wish.
    |
    | Argon2id est recommandé car il offre:
    | - Résistance aux attaques par canal auxiliaire (timing attacks)
    | - Résistance aux attaques GPU/ASIC
    | - Meilleure sécurité que bcrypt pour les mots de passe
    |
    | Supported: "bcrypt", "argon", "argon2id"
    |
    */

    'driver' => env('HASH_DRIVER', 'argon2id'),

    /*
    |--------------------------------------------------------------------------
    | Bcrypt Options
    |--------------------------------------------------------------------------
    |
    | Here you may specify the configuration options that should be used when
    | passwords are hashed using the Bcrypt algorithm. This will allow you
    | to control the amount of time it takes to hash the given password.
    |
    | rounds: Nombre d'itérations (10-12 recommandé, 12 pour plus de sécurité)
    |
    */

    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 12),
        'verify' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Argon Options
    |--------------------------------------------------------------------------
    |
    | Here you may specify the configuration options that should be used when
    | passwords are hashed using the Argon algorithm. These will allow you
    | to control the amount of time it takes to hash the given password.
    |
    | memory:      Mémoire en KiB (65536 = 64MB recommandé pour serveurs)
    | time:        Nombre d'itérations (4 recommandé)
    | threads:     Nombre de threads parallèles (2-4 recommandé)
    |
    | Ces valeurs offrent un bon équilibre sécurité/performance.
    | Augmenter 'memory' rend les attaques GPU encore plus difficiles.
    |
    */

    'argon' => [
        'memory' => env('ARGON_MEMORY', 65536),  // 64 MB
        'threads' => env('ARGON_THREADS', 2),
        'time' => env('ARGON_TIME', 4),
        'verify' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Rehash On Login
    |--------------------------------------------------------------------------
    |
    | Si activé, les mots de passe seront automatiquement re-hachés lors
    | de la connexion si les paramètres de hachage ont changé.
    | Utile pour migrer de bcrypt vers argon2id sans forcer les utilisateurs
    | à changer leur mot de passe.
    |
    */

    'rehash_on_login' => true,

];
