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

Route::middleware('auth:sanctum')->group(function () {
    // Notifications in-app
    Route::get('/notifications', [AlertController::class, 'index']);
    Route::get('/notifications/unread-count', [AlertController::class, 'unreadCount']);
    Route::get('/notifications/alerts', [AlertController::class, 'alerts']);
    Route::get('/notifications/stats', [AlertController::class, 'stats']);
    Route::put('/notifications/{id}/read', [AlertController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [AlertController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [AlertController::class, 'destroy']);
    Route::delete('/notifications', [AlertController::class, 'destroyAll']);
});
