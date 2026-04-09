<?php

return [
    App\Providers\AppServiceProvider::class,

    // Broadcasting (Pusher / WebSockets)
    Illuminate\Broadcasting\BroadcastServiceProvider::class,

    // Sanctum (routes /sanctum/csrf-cookie + auth SPA)
    Laravel\Sanctum\SanctumServiceProvider::class,

    // Spatie Permission (gestion des rôles)
    Spatie\Permission\PermissionServiceProvider::class,
];
