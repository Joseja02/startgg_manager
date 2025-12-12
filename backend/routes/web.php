<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\StartggController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('auth')->group(function () {
    Route::get('/login', [StartggController::class, 'login']);
    Route::get('/callback', [StartggController::class, 'callback']);
    
    // Temporary debug endpoint to verify session & cookie state (remove in production)
    Route::get('/debug', function (Illuminate\Http\Request $request) {
        return response()->json([
            'session_id' => $request->session()->getId(),
            'session_driver' => config('session.driver'),
            'session_cookie_name' => config('session.cookie'),
            'session_same_site' => config('session.same_site'),
            'session_secure' => config('session.secure'),
            'session_http_only' => config('session.http_only'),
            'session_domain' => config('session.domain'),
            'all_cookies' => $request->cookies->all(),
            'session_data' => $request->session()->all(),
        ]);
    });
});

