<?php

use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Ce backend est principalement une API, mais Sanctum utilise une route web
| pour poser le cookie XSRF-TOKEN.
|
*/

// Sanctum CSRF cookie (SPA) - supporte tous les chemins possibles
Route::get('sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);
Route::get('backend/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);
Route::get('backend/public/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);

// Health simple côté web
Route::get('/', function () {
    return response()->json(['status' => 'ok']);
});
