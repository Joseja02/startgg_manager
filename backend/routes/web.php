<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StartggController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('auth')->group(function () {
    Route::get('/login', [StartggController::class, 'login']);
    Route::get('/callback', [StartggController::class, 'callback']);
});
