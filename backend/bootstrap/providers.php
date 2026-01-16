<?php

return [
    App\Providers\AppServiceProvider::class,
    
    // Sanctum (routes /sanctum/csrf-cookie + auth SPA)
    Laravel\Sanctum\SanctumServiceProvider::class,
    
    // Spatie Permission (gestion des rôles)
    Spatie\Permission\PermissionServiceProvider::class,
];
