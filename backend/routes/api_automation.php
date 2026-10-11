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

    // Lecture seule supplémentaire pour Mora (aucune écriture).
    $fc = \App\Http\Controllers\Api\Automation\AutomationFactureController::class;
    $fi = \App\Http\Controllers\Api\Automation\AutomationFinanceController::class;
    $dc = \App\Http\Controllers\Api\Automation\AutomationDocumentController::class;
    Route::get('factures/en-retard', [$fc, 'enRetard'])->middleware("$a:factures:lire");
    Route::get('factures/{numero}', [$fc, 'show'])->where('numero', 'FAC-[A-Za-z0-9\-]+')->middleware("$a:factures:lire");
    Route::get('clients/{id}/factures', [$fc, 'parClient'])->whereNumber('id')->middleware("$a:factures:lire");
    Route::get('clients/{id}/releve', [$fc, 'releve'])->whereNumber('id')->middleware("$a:factures:lire");
    Route::get('caisse/solde', [$fi, 'solde'])->middleware("$a:caisse:lire");
    Route::get('caisse/mouvements', [$fi, 'mouvements'])->middleware("$a:caisse:lire");
    Route::get('dashboard/stats', [$fi, 'stats'])->middleware("$a:dashboard:lire");
    Route::get('ordres/{numero}', [$dc, 'ordre'])->where('numero', 'OT-[A-Za-z0-9\-]+')->middleware("$a:ordres:lire");
    Route::get('clients/{id}/ordres', [$dc, 'ordresClient'])->whereNumber('id')->middleware("$a:ordres:lire");
    Route::get('devis/{numero}', [$dc, 'devis'])->where('numero', 'DEV-[A-Za-z0-9\-]+')->middleware("$a:devis:lire");
    Route::get('clients/{id}/devis', [$dc, 'devisClient'])->whereNumber('id')->middleware("$a:devis:lire");
    Route::get('clients/{id}', [$dc, 'client'])->whereNumber('id')->middleware("$a:clients:lire");
});
