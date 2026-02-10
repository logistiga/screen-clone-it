<?php

use App\Http\Controllers\Api\ConteneurTraiteController;
use App\Http\Controllers\Api\ConteneurAnomalieController;
use App\Http\Controllers\Api\SyncDiagnosticController;
use Illuminate\Support\Facades\Route;

// ============================================
// CONTENEURS EN ATTENTE
// ============================================
Route::prefix('conteneurs-en-attente')->middleware('audit')->group(function () {
    Route::get('/', [ConteneurTraiteController::class, 'index'])
        ->middleware('permission:ordres.voir');
    Route::get('stats', [ConteneurTraiteController::class, 'stats'])
        ->middleware('permission:ordres.voir');
    Route::post('{conteneur}/affecter', [ConteneurTraiteController::class, 'affecterAOrdre'])
        ->middleware('permission:ordres.modifier');
    Route::post('{conteneur}/creer-ordre', [ConteneurTraiteController::class, 'creerOrdre'])
        ->middleware('permission:ordres.creer');
    Route::post('{conteneur}/ignorer', [ConteneurTraiteController::class, 'ignorer'])
        ->middleware('permission:ordres.modifier');
});

// ============================================
// ANOMALIES CONTENEURS
// ============================================
Route::prefix('conteneurs-anomalies')->middleware('audit')->group(function () {
    Route::get('/', [ConteneurAnomalieController::class, 'index'])
        ->middleware('permission:ordres.voir');
    Route::get('stats', [ConteneurAnomalieController::class, 'stats'])
        ->middleware('permission:ordres.voir');
    Route::post('detecter', [ConteneurAnomalieController::class, 'detecter'])
        ->middleware('permission:ordres.modifier');
    Route::post('traiter-masse', [ConteneurAnomalieController::class, 'traiterEnMasse'])
        ->middleware('permission:ordres.modifier');
    Route::post('{anomalie}/ajouter', [ConteneurAnomalieController::class, 'ajouterAOrdre'])
        ->middleware('permission:ordres.modifier');
    Route::post('{anomalie}/ignorer', [ConteneurAnomalieController::class, 'ignorer'])
        ->middleware('permission:ordres.modifier');
});

// ============================================
// SYNC DIAGNOSTIC (OPS)
// ============================================
Route::prefix('sync-diagnostic')->middleware('audit')->group(function () {
    Route::get('health-ops', [SyncDiagnosticController::class, 'healthOps'])
        ->middleware('permission:configuration.voir');
    Route::post('sync-conteneurs', [SyncDiagnosticController::class, 'syncConteneurs'])
        ->middleware('permission:configuration.modifier');
    Route::post('sync-armateurs', [SyncDiagnosticController::class, 'syncArmateurs'])
        ->middleware('permission:configuration.modifier');
    Route::post('sync-all', [SyncDiagnosticController::class, 'syncAll'])
        ->middleware('permission:configuration.modifier');
});
