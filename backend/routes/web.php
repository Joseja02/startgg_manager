<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\StartggController;

Route::get('/', function () {
    return view('welcome');
});

// OAuth StartGG (rutas web con sesión/cookies)
Route::get('/auth/login', [StartggController::class, 'login']);
Route::get('/auth/callback', [StartggController::class, 'callback']);

// Ruta de diagnóstico temporal (eliminar en producción)
Route::get('/auth/debug', [StartggController::class, 'debug']);

