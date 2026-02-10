<?php

use App\Http\Controllers\Api\ClientController;
use Illuminate\Support\Facades\Route;

// ============================================
// CLIENTS
// ============================================
Route::prefix('clients')->middleware('audit')->group(function () {
    Route::get('/', [ClientController::class, 'index'])
        ->middleware('permission:clients.voir');
    Route::get('stats', [ClientController::class, 'globalStats'])
        ->middleware(['permission:clients.voir', 'throttle:stats']);
    Route::post('/', [ClientController::class, 'store'])
        ->middleware('permission:clients.creer');
    Route::get('{client}', [ClientController::class, 'show'])
        ->middleware('permission:clients.voir');
    Route::put('{client}', [ClientController::class, 'update'])
        ->middleware('permission:clients.modifier');
    Route::delete('{client}', [ClientController::class, 'destroy'])
        ->middleware('permission:clients.supprimer');
    Route::get('{client}/stats', [ClientController::class, 'stats'])
        ->middleware(['permission:clients.voir', 'throttle:stats']);
});
