<?php

use App\Http\Controllers\Api\AiAssistantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes IA Assistant
|--------------------------------------------------------------------------
*/

Route::prefix('ai')->group(function () {
    Route::post('chat', [AiAssistantController::class, 'chat']);
    Route::get('context', [AiAssistantController::class, 'context']);
});
