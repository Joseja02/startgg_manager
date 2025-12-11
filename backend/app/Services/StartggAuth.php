<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StartggAuth
{
    public function refresh(User $user): ?string
    {
        $refreshToken = $user->startgg_refresh_token;
        if (!$refreshToken) {
            return null;
        }

        $resp = Http::asForm()->post('https://api.start.gg/oauth/access_token', [
            'grant_type' => 'refresh_token',
            'client_id' => config('startgg.client_id'),
            'client_secret' => config('startgg.client_secret'),
            'refresh_token' => $refreshToken,
        ]);

        if ($resp->failed()) {
            Log::warning('startgg refresh failed', ['status' => $resp->status(), 'body' => $resp->body()]);
            return null;
        }

        $data = $resp->json();
        $user->startgg_access_token = $data['access_token'] ?? $user->startgg_access_token;
        if (!empty($data['refresh_token'])) {
            $user->startgg_refresh_token = $data['refresh_token'];
        }
        if (!empty($data['expires_in'])) {
            $user->token_expires_at = Carbon::now()->addSeconds((int) $data['expires_in']);
        }
        $user->save();

        return $user->startgg_access_token;
    }

    public function isExpired(User $user): bool
    {
        return $user->token_expires_at && now()->greaterThanOrEqualTo($user->token_expires_at);
    }
}
