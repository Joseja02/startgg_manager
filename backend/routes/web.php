<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\StartggController;

Route::get('/', function () {
    return view('welcome');
});
