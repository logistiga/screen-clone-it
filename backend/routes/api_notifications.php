<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AlertController;

/*
|--------------------------------------------------------------------------
| Notifications API Routes
|--------------------------------------------------------------------------
|
| Ces routes gèrent les notifications in-app utilisateur.
| Toutes les routes nécessitent une authentification.
|
| À inclure dans routes/api.php:
| require __DIR__.'/api_notifications.php';
|
*/

// Les routes sont déjà dans le groupe auth:sanctum de api.php
// Pas besoin de redéfinir le middleware ici
Route::prefix('alerts')->group(function () {
    Route::get('/', [AlertController::class, 'index']);
    Route::get('/unread-count', [AlertController::class, 'unreadCount']);
    Route::get('/system', [AlertController::class, 'alerts']);
    Route::get('/stats', [AlertController::class, 'stats']);
    Route::put('/{id}/read', [AlertController::class, 'markAsRead']);
    Route::put('/mark-all-read', [AlertController::class, 'markAllAsRead']);
    Route::delete('/{id}', [AlertController::class, 'destroy']);
    Route::delete('/', [AlertController::class, 'destroyAll']);
});
