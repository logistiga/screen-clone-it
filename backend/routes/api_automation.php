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
});
