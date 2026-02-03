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

// Sanctum CSRF cookie (SPA)
Route::get('sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);
// Si l'app est servie sous /backend (proxy/alias), accepter aussi ce chemin
Route::get('backend/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);

// Health simple côté web
Route::get('/', function () {
    return response()->json(['status' => 'ok']);
});
