<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\StartggAuth;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(private StartggAuth $auth) {}

    public function refresh(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $token = $this->auth->refresh($user);
        if (!$token) {
            return response()->json(['error' => 'Refresh failed'], 400);
        }

        return response()->json(['ok' => true, 'expires_at' => $user->token_expires_at]);
    }
}
