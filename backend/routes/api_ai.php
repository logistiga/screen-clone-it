<?php

use App\Http\Controllers\Api\AiAssistantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes IA Assistant
|--------------------------------------------------------------------------
*/

Route::prefix('ai')->middleware('role:administrateur|directeur')->group(function () {
    Route::post('chat', [AiAssistantController::class, 'chat']);
    Route::get('context', [AiAssistantController::class, 'context']);
    Route::get('history', [AiAssistantController::class, 'history']);
    Route::get('settings', [AiAssistantController::class, 'getSettings']);
    Route::put('settings', [AiAssistantController::class, 'updateSettings']);
    Route::post('test-connection', [AiAssistantController::class, 'testConnection']);
});
