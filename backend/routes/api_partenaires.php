<?php

use App\Http\Controllers\Api\TransitaireController;
use App\Http\Controllers\Api\RepresentantController;
use App\Http\Controllers\Api\ArmateurController;
use Illuminate\Support\Facades\Route;

// ============================================
// PARTENAIRES - TRANSITAIRES
// ============================================
Route::prefix('transitaires')->middleware('audit')->group(function () {
    Route::get('/', [TransitaireController::class, 'index'])
        ->middleware('permission:transitaires.voir');
    Route::post('/', [TransitaireController::class, 'store'])
        ->middleware('permission:transitaires.creer');
    Route::get('{transitaire}', [TransitaireController::class, 'show'])
        ->middleware('permission:transitaires.voir');
    Route::put('{transitaire}', [TransitaireController::class, 'update'])
        ->middleware('permission:transitaires.modifier');
    Route::delete('{transitaire}', [TransitaireController::class, 'destroy'])
        ->middleware('permission:transitaires.supprimer');
});

// ============================================
// PARTENAIRES - REPRESENTANTS
// ============================================
Route::prefix('representants')->middleware('audit')->group(function () {
    Route::get('/', [RepresentantController::class, 'index'])
        ->middleware('permission:representants.voir');
    Route::post('/', [RepresentantController::class, 'store'])
        ->middleware('permission:representants.creer');
    Route::get('{representant}', [RepresentantController::class, 'show'])
        ->middleware('permission:representants.voir');
    Route::put('{representant}', [RepresentantController::class, 'update'])
        ->middleware('permission:representants.modifier');
    Route::delete('{representant}', [RepresentantController::class, 'destroy'])
        ->middleware('permission:representants.supprimer');
});

// ============================================
// ARMATEURS
// ============================================
Route::prefix('armateurs')->middleware('audit')->group(function () {
    Route::get('/', [ArmateurController::class, 'index'])
        ->middleware('permission:armateurs.voir');
    Route::post('/', [ArmateurController::class, 'store'])
        ->middleware('permission:armateurs.creer');
    Route::get('{armateur}', [ArmateurController::class, 'show'])
        ->middleware('permission:armateurs.voir');
    Route::put('{armateur}', [ArmateurController::class, 'update'])
        ->middleware('permission:armateurs.modifier');
    Route::delete('{armateur}', [ArmateurController::class, 'destroy'])
        ->middleware('permission:armateurs.supprimer');
});
