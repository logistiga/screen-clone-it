<?php

use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\EmailAutomationController;
use App\Http\Controllers\Api\EmailConfigController;
use Illuminate\Support\Facades\Route;

// ============================================
// EMAIL & NOTIFICATIONS
// ============================================
Route::prefix('notifications')->middleware('audit')->group(function () {
    Route::post('factures/{facture}/send', [NotificationController::class, 'envoyerFacture'])
        ->middleware('permission:factures.modifier');
    Route::post('devis/{devis}/send', [NotificationController::class, 'envoyerDevis'])
        ->middleware('permission:devis.modifier');
    Route::post('ordres/{ordre}/send', [NotificationController::class, 'envoyerOrdre'])
        ->middleware('permission:ordres.modifier');
});

Route::prefix('email-templates')->middleware('audit')->group(function () {
    Route::get('/', [EmailTemplateController::class, 'index'])
        ->middleware('permission:configuration.voir');
    Route::post('/', [EmailTemplateController::class, 'store'])
        ->middleware('permission:configuration.modifier');
    Route::get('{template}', [EmailTemplateController::class, 'show'])
        ->middleware('permission:configuration.voir');
    Route::put('{template}', [EmailTemplateController::class, 'update'])
        ->middleware('permission:configuration.modifier');
    Route::delete('{template}', [EmailTemplateController::class, 'destroy'])
        ->middleware('permission:configuration.modifier');
    Route::post('{template}/preview', [EmailTemplateController::class, 'preview'])
        ->middleware('permission:configuration.voir');
});

Route::prefix('email-automation')->middleware('audit')->group(function () {
    Route::get('/', [EmailAutomationController::class, 'index'])
        ->middleware('permission:configuration.voir');
    Route::put('/', [EmailAutomationController::class, 'update'])
        ->middleware('permission:configuration.modifier');
    Route::post('test/{type}', [EmailAutomationController::class, 'testSend'])
        ->middleware('permission:configuration.modifier');
});

Route::prefix('email-config')->middleware('audit')->group(function () {
    Route::get('/', [EmailConfigController::class, 'index'])
        ->middleware('permission:configuration.voir');
    Route::put('/', [EmailConfigController::class, 'update'])
        ->middleware('permission:configuration.modifier');
    Route::post('test', [EmailConfigController::class, 'testConnection'])
        ->middleware('permission:configuration.modifier');
});
