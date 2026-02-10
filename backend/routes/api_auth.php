<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\SuspiciousLoginController;
use Illuminate\Support\Facades\Route;

// ============================================
// AUTH & PROFIL (protégé)
// ============================================
Route::prefix('auth')->group(function () {
    Route::get('user', [AuthController::class, 'user']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refreshToken']);
    Route::put('profile', [AuthController::class, 'updateProfile']);
    Route::put('password', [AuthController::class, 'updatePassword']);
});

// ============================================
// SESSIONS (gestion des sessions actives)
// ============================================
Route::prefix('sessions')->group(function () {
    Route::get('/', [SessionController::class, 'index']);
    Route::get('current', [SessionController::class, 'current']);
    Route::delete('{sessionId}', [SessionController::class, 'destroy']);
    Route::post('revoke-others', [SessionController::class, 'revokeOthers']);
    Route::post('revoke-all', [SessionController::class, 'revokeAll']);
});
