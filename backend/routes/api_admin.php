<?php

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\SuspiciousLoginController;
use App\Http\Controllers\Api\ConfigurationController;
use Illuminate\Support\Facades\Route;

// ============================================
// CONFIGURATION
// ============================================
Route::prefix('configuration')->middleware('audit')->group(function () {
    Route::get('/', [ConfigurationController::class, 'index'])
        ->middleware('permission:configuration.voir');
    Route::put('/', [ConfigurationController::class, 'update'])
        ->middleware('permission:configuration.modifier');
    Route::get('{key}', [ConfigurationController::class, 'show'])
        ->middleware('permission:configuration.voir');
    Route::put('{key}', [ConfigurationController::class, 'updateKey'])
        ->middleware('permission:configuration.modifier');
});

// ============================================
// ADMINISTRATION - UTILISATEURS
// ============================================
Route::prefix('admin/users')->middleware(['audit', 'role:administrateur|directeur'])->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::post('/', [UserController::class, 'store']);
    Route::get('{user}', [UserController::class, 'show']);
    Route::put('{user}', [UserController::class, 'update']);
    Route::delete('{user}', [UserController::class, 'destroy']);
    Route::post('{user}/toggle-active', [UserController::class, 'toggleActive']);
    Route::post('{user}/reset-password', [UserController::class, 'resetPassword']);
});

// ============================================
// ADMINISTRATION - RÔLES & PERMISSIONS
// ============================================
Route::prefix('admin/roles')->middleware(['audit', 'role:administrateur|directeur'])->group(function () {
    Route::get('/', [RoleController::class, 'index']);
    Route::post('/', [RoleController::class, 'store']);
    Route::get('stats', [RoleController::class, 'stats']);
    Route::get('permissions', [RoleController::class, 'permissions']);
    Route::get('{role}', [RoleController::class, 'show']);
    Route::put('{role}', [RoleController::class, 'update']);
    Route::delete('{role}', [RoleController::class, 'destroy']);
});

// ============================================
// AUDIT LOGS
// ============================================
Route::prefix('admin/audit')->middleware('role:administrateur|directeur')->group(function () {
    Route::get('/', [AuditController::class, 'index']);
    Route::get('actions', [AuditController::class, 'actions']);
    Route::get('tables', [AuditController::class, 'tables']);
    Route::get('stats', [AuditController::class, 'stats'])
        ->middleware('throttle:stats');
    Route::get('export', [AuditController::class, 'export']);
    Route::get('{auditLog}', [AuditController::class, 'show']);
});

// ============================================
// ADMINISTRATION - CONNEXIONS SUSPECTES
// ============================================
Route::prefix('suspicious-logins')->middleware(['audit', 'permission:securite.voir'])->group(function () {
    Route::get('/', [SuspiciousLoginController::class, 'index']);
    Route::get('stats', [SuspiciousLoginController::class, 'stats']);
});
