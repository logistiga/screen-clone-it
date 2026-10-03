<?php

use App\Http\Controllers\Api\ChatGpt\ChatGptController;
use App\Http\Middleware\ChatGptAuth;
use Illuminate\Support\Facades\Route;

/*
| Intégration ChatGPT — lecture seule, token dédié (hors session utilisateur).
*/
Route::prefix('gpt')->middleware(ChatGptAuth::class)->group(function () {
    Route::get('schema', [ChatGptController::class, 'schema']);
    Route::get('search', [ChatGptController::class, 'search']);
    Route::post('query', [ChatGptController::class, 'query']);
    Route::get('clients/{id}/summary', [ChatGptController::class, 'clientSummary'])->whereNumber('id');
    Route::get('factures/impayees', [ChatGptController::class, 'unpaidInvoices']);
    Route::get('stats/chiffre-affaires', [ChatGptController::class, 'revenue']);
    Route::get('resources/{resource}', [ChatGptController::class, 'list'])->where('resource', '[a-z_]+');
    // Toute écriture est interceptée par ChatGptAuth (réponse JSON READ_ONLY 405).
    Route::match(['PUT', 'PATCH', 'DELETE'], '{any}', fn () => abort(405))->where('any', '.*');
});
