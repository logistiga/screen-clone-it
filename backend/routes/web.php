<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Ce backend est principalement une API. Ce fichier doit exister car il est
| référencé dans bootstrap/app.php.
|
*/

// (Optionnel) health simple côté web
Route::get('/', function () {
    return response()->json(['status' => 'ok']);
});
