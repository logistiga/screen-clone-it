<?php

use App\Http\Controllers\Api\AiAssistantController;
use App\Http\Controllers\Api\Mcp\McpAccessKeyController;
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

// Clés d'accès au serveur MCP (IA externes et agents)
Route::prefix('ai/mcp-keys')->middleware(['audit', 'role:administrateur|directeur'])->group(function () {
    Route::get('/', [McpAccessKeyController::class, 'index']);
    Route::post('/', [McpAccessKeyController::class, 'store']);
    Route::post('{id}/revoke', [McpAccessKeyController::class, 'revoke'])->whereNumber('id');
});
