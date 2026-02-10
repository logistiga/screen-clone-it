<?php

use App\Http\Controllers\Api\ReportingController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Route;

// ============================================
// DASHBOARD
// ============================================
Route::prefix('dashboard')->middleware('throttle:dashboard')->group(function () {
    Route::get('/', [DashboardController::class, 'index']);
    Route::get('graphiques', [DashboardController::class, 'graphiques']);
    Route::get('alertes', [DashboardController::class, 'alertes']);
    Route::get('activite-recente', [DashboardController::class, 'activiteRecente']);
    Route::post('invalidate-cache', [DashboardController::class, 'invalidateCache'])
        ->middleware('permission:configuration.modifier');
});

// ============================================
// REPORTING
// ============================================
Route::prefix('reporting')->middleware(['audit', 'throttle:reporting'])->group(function () {
    Route::get('pdf', [ReportingController::class, 'exportPdf'])
        ->middleware('permission:reporting.voir');
    Route::get('chiffre-affaires', [ReportingController::class, 'chiffreAffaires'])
        ->middleware('permission:reporting.voir');
    Route::get('creances', [ReportingController::class, 'creances'])
        ->middleware('permission:reporting.voir');
    Route::get('rentabilite-clients', [ReportingController::class, 'rentabilite'])
        ->middleware('permission:reporting.voir');
    Route::get('evolution-mensuelle', [ReportingController::class, 'chiffreAffaires'])
        ->middleware('permission:reporting.voir');
    Route::get('comparaison-periodes', [ReportingController::class, 'comparatif'])
        ->middleware('permission:reporting.voir');
    Route::get('top-clients', [ReportingController::class, 'activiteClients'])
        ->middleware('permission:reporting.voir');
    Route::get('analyse-operations', [ReportingController::class, 'statistiquesDocuments'])
        ->middleware('permission:reporting.voir');
    Route::get('tresorerie', [ReportingController::class, 'tresorerie'])
        ->middleware('permission:reporting.voir');
    Route::get('synthese', [ReportingController::class, 'dashboard'])
        ->middleware('permission:reporting.voir');
});

// ============================================
// EXPORT
// ============================================
Route::prefix('export')->middleware(['audit', 'throttle:exports'])->group(function () {
    // CSV exports
    Route::get('factures', [ExportController::class, 'factures'])
        ->middleware('permission:factures.voir');
    Route::get('devis', [ExportController::class, 'devis'])
        ->middleware('permission:devis.voir');
    Route::get('ordres-travail', [ExportController::class, 'ordres'])
        ->middleware('permission:ordres.voir');
    Route::get('paiements', [ExportController::class, 'paiements'])
        ->middleware('permission:paiements.voir');
    Route::get('clients', [ExportController::class, 'clients'])
        ->middleware('permission:clients.voir');
    Route::get('primes', [ExportController::class, 'primes'])
        ->middleware('permission:paiements.voir');
    Route::get('caisse', [ExportController::class, 'caisse'])
        ->middleware('permission:caisse.voir');
    Route::get('caisse-especes', [ExportController::class, 'caisseEspeces'])
        ->middleware('permission:caisse.voir');
    Route::get('caisse-globale', [ExportController::class, 'caisseGlobale'])
        ->middleware('permission:caisse.voir');
    Route::get('creances', [ExportController::class, 'creances'])
        ->middleware('permission:reporting.voir');
    Route::get('tresorerie', [ExportController::class, 'tresorerie'])
        ->middleware('permission:reporting.voir');
    Route::get('credits', [ExportController::class, 'credits'])
        ->middleware('permission:credits.voir');
    Route::get('annulations', [ExportController::class, 'annulations'])
        ->middleware('permission:factures.voir');
    Route::get('chiffre-affaires', [ExportController::class, 'chiffreAffaires'])
        ->middleware('permission:reporting.voir');
    Route::get('activite-globale', [ExportController::class, 'activiteGlobale'])
        ->middleware('permission:reporting.voir');
    Route::get('tableau-de-bord', [ExportController::class, 'tableauDeBord'])
        ->middleware('permission:reporting.voir');
    Route::get('roles', [ExportController::class, 'roles'])
        ->middleware('permission:utilisateurs.voir');

    // PDF exports
    Route::get('factures/pdf', [ExportController::class, 'facturesPdf'])
        ->middleware('permission:factures.voir');
    Route::get('devis/pdf', [ExportController::class, 'devisPdf'])
        ->middleware('permission:devis.voir');
    Route::get('ordres-travail/pdf', [ExportController::class, 'ordresPdf'])
        ->middleware('permission:ordres.voir');
    Route::get('paiements/pdf', [ExportController::class, 'paiementsPdf'])
        ->middleware('permission:paiements.voir');
    Route::get('clients/pdf', [ExportController::class, 'clientsPdf'])
        ->middleware('permission:clients.voir');
    Route::get('primes/pdf', [ExportController::class, 'primesPdf'])
        ->middleware('permission:paiements.voir');
    Route::get('caisse/pdf', [ExportController::class, 'caissePdf'])
        ->middleware('permission:caisse.voir');
    Route::get('creances/pdf', [ExportController::class, 'creancesPdf'])
        ->middleware('permission:reporting.voir');
    Route::get('annulations/pdf', [ExportController::class, 'annulationsPdf'])
        ->middleware('permission:factures.voir');
    Route::get('credits/pdf', [ExportController::class, 'creditsPdf'])
        ->middleware('permission:credits.voir');
    Route::get('activite-globale/pdf', [ExportController::class, 'activiteGlobalePdf'])
        ->middleware('permission:reporting.voir');
});
