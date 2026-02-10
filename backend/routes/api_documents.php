<?php

use App\Http\Controllers\Api\DevisController;
use App\Http\Controllers\Api\OrdreTravailController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\NoteDebutController;
use App\Http\Controllers\Api\AnnulationController;
use Illuminate\Support\Facades\Route;

// ============================================
// DEVIS
// ============================================
Route::prefix('devis')->middleware('audit')->group(function () {
    Route::get('/', [DevisController::class, 'index'])
        ->middleware('permission:devis.voir');
    Route::post('/', [DevisController::class, 'store'])
        ->middleware('permission:devis.creer');
    Route::get('{devis}', [DevisController::class, 'show'])
        ->middleware('permission:devis.voir');
    Route::put('{devis}', [DevisController::class, 'update'])
        ->middleware('permission:devis.modifier');
    Route::delete('{devis}', [DevisController::class, 'destroy'])
        ->middleware('permission:devis.supprimer');
    Route::post('{devis}/convert-ordre', [DevisController::class, 'convertToOrdre'])
        ->middleware('permission:ordres.creer');
    Route::post('{devis}/convert-facture', [DevisController::class, 'convertToFacture'])
        ->middleware('permission:factures.creer');
    Route::post('{devis}/duplicate', [DevisController::class, 'duplicate'])
        ->middleware('permission:devis.creer');
});

// ============================================
// ORDRES DE TRAVAIL
// ============================================
Route::prefix('ordres-travail')->middleware('audit')->group(function () {
    Route::get('/', [OrdreTravailController::class, 'index'])
        ->middleware('permission:ordres.voir');
    Route::get('stats', [OrdreTravailController::class, 'stats'])
        ->middleware(['permission:ordres.voir', 'throttle:stats']);
    Route::get('check-conteneur', [OrdreTravailController::class, 'checkConteneur'])
        ->middleware('permission:ordres.voir');
    Route::get('check-bl', [OrdreTravailController::class, 'checkBL'])
        ->middleware('permission:ordres.voir');
    Route::get('description-suggestions', [OrdreTravailController::class, 'descriptionSuggestions'])
        ->middleware('permission:ordres.voir');
    Route::post('/', [OrdreTravailController::class, 'store'])
        ->middleware('permission:ordres.creer');
    Route::get('{ordreTravail}', [OrdreTravailController::class, 'show'])
        ->middleware('permission:ordres.voir');
    Route::put('{ordreTravail}', [OrdreTravailController::class, 'update'])
        ->middleware('permission:ordres.modifier');
    Route::delete('{ordreTravail}', [OrdreTravailController::class, 'destroy'])
        ->middleware('permission:ordres.supprimer');
    Route::post('{ordreTravail}/convert-facture', [OrdreTravailController::class, 'convertToFacture'])
        ->middleware('permission:factures.creer');
});

// ============================================
// FACTURES
// ============================================
Route::prefix('factures')->middleware('audit')->group(function () {
    Route::get('/', [FactureController::class, 'index'])
        ->middleware('permission:factures.voir');
    Route::post('/', [FactureController::class, 'store'])
        ->middleware('permission:factures.creer');
    Route::get('impayes', [FactureController::class, 'impayes'])
        ->middleware('permission:factures.voir');
    Route::get('{facture}', [FactureController::class, 'show'])
        ->middleware('permission:factures.voir');
    Route::put('{facture}', [FactureController::class, 'update'])
        ->middleware('permission:factures.modifier');
    Route::delete('{facture}', [FactureController::class, 'destroy'])
        ->middleware('permission:factures.supprimer');
    Route::post('{facture}/annuler', [FactureController::class, 'annuler'])
        ->middleware('permission:factures.modifier');
    Route::post('{facture}/duplicate', [FactureController::class, 'duplicate'])
        ->middleware('permission:factures.creer');
});

// ============================================
// NOTE DE DÉBIT
// ============================================
Route::prefix('notes-debit')->middleware('audit')->group(function () {
    Route::get('stats', [NoteDebutController::class, 'stats'])
        ->middleware(['permission:notes_debit.voir', 'throttle:stats']);
    Route::get('/', [NoteDebutController::class, 'index'])
        ->middleware('permission:notes_debit.voir');
    Route::post('/', [NoteDebutController::class, 'store'])
        ->middleware('permission:notes_debit.creer');
    Route::get('{id}/pdf', [NoteDebutController::class, 'downloadPdf'])
        ->middleware('permission:notes_debit.voir');
    Route::post('{id}/envoyer-email', [NoteDebutController::class, 'sendEmail'])
        ->middleware('permission:notes_debit.voir');
    Route::get('{noteDebut}', [NoteDebutController::class, 'show'])
        ->middleware('permission:notes_debit.voir');
    Route::put('{noteDebut}', [NoteDebutController::class, 'update'])
        ->middleware('permission:notes_debit.modifier');
    Route::delete('{noteDebut}', [NoteDebutController::class, 'destroy'])
        ->middleware('permission:notes_debit.supprimer');
    Route::post('{noteDebut}/valider', [NoteDebutController::class, 'valider'])
        ->middleware('permission:notes_debit.valider');
    Route::post('{noteDebut}/duplicate', [NoteDebutController::class, 'duplicate'])
        ->middleware('permission:notes_debit.creer');
});

// ============================================
// ANNULATIONS
// ============================================
Route::prefix('annulations')->middleware('audit')->group(function () {
    Route::get('stats', [AnnulationController::class, 'stats'])
        ->middleware(['permission:ordres.voir', 'throttle:stats']);
    Route::post('facture/{facture}', [AnnulationController::class, 'annulerFacture'])
        ->middleware('permission:factures.annuler');
    Route::post('ordre/{ordre}', [AnnulationController::class, 'annulerOrdre'])
        ->middleware('permission:ordres.annuler');
    Route::post('devis/{devis}', [AnnulationController::class, 'annulerDevis'])
        ->middleware('permission:devis.annuler');
    Route::get('client/{clientId}', [AnnulationController::class, 'historiqueClient'])
        ->middleware('permission:clients.voir');
    Route::get('avoirs/client/{clientId}', [AnnulationController::class, 'avoirsClient'])
        ->middleware('permission:clients.voir');
    Route::get('/', [AnnulationController::class, 'index'])
        ->middleware('permission:ordres.voir');
    Route::post('/', [AnnulationController::class, 'store'])
        ->middleware('permission:ordres.annuler');
    Route::get('{annulation}', [AnnulationController::class, 'show'])
        ->middleware('permission:ordres.voir');
    Route::put('{annulation}', [AnnulationController::class, 'update'])
        ->middleware('permission:ordres.modifier');
    Route::post('{annulation}/valider', [AnnulationController::class, 'valider'])
        ->middleware('permission:ordres.valider');
    Route::post('{annulation}/rejeter', [AnnulationController::class, 'rejeter'])
        ->middleware('permission:ordres.valider');
    Route::post('{annulation}/generer-avoir', [AnnulationController::class, 'genererAvoir'])
        ->middleware('permission:factures.creer');
    Route::post('{annulation}/rembourser', [AnnulationController::class, 'rembourser'])
        ->middleware('permission:caisse.creer');
    Route::post('{annulation}/utiliser-avoir', [AnnulationController::class, 'utiliserAvoir'])
        ->middleware('permission:paiements.creer');
});
