<?php

use App\Http\Controllers\Api\Automation\AutomationController;
use App\Http\Middleware\AutomationAuth;
use Illuminate\Support\Facades\Route;

/*
| Automatisation n8n / Mora — clé machine dédiée, permissions par route.
| Seule écriture possible : création d'un devis BROUILLON (jamais envoyé, jamais facturé).
*/
Route::prefix('automation')->group(function () {
    $a = AutomationAuth::class;
    Route::get('clients', [AutomationController::class, 'clients'])->middleware("$a:clients:lire");
    Route::get('clients/{id}/historique-prix', [AutomationController::class, 'historiquePrix'])
        ->whereNumber('id')->middleware("$a:clients:lire");
    Route::post('devis', [AutomationController::class, 'creerDevis'])
        ->middleware("$a:devis:creer");
    Route::get('devis/{id}', [AutomationController::class, 'devis'])->whereNumber('id')->middleware("$a:devis:lire");
    Route::get('factures/impayees', [AutomationController::class, 'facturesImpayees'])->middleware("$a:factures:lire");
    Route::post('devis/{id}/lien-pdf', [\App\Http\Controllers\Api\Automation\AutomationPdfController::class, 'lien'])
        ->whereNumber('id')->middleware("$a:devis:lire");
    // Public mais protégé par signature temporaire (pas de clé, pas de session).
    Route::get('devis/{id}/pdf', [\App\Http\Controllers\Api\Automation\AutomationPdfController::class, 'telecharger'])
        ->whereNumber('id')->middleware('throttle:30,1')->name('automation.devis.pdf');

    $fp = \App\Http\Controllers\Api\Automation\AutomationFacturePdfController::class;
    Route::get('clients/{id}/derniere-facture', [$fp, 'derniere'])->whereNumber('id')->middleware("$a:factures:lire");
    Route::post('factures/{id}/lien-pdf', [$fp, 'lien'])->whereNumber('id')->middleware("$a:factures:lire");
    Route::get('factures/{id}/pdf', [$fp, 'telecharger'])
        ->whereNumber('id')->middleware('throttle:30,1')->name('automation.factures.pdf');
});
