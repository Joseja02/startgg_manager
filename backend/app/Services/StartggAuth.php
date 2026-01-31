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

    /**
     * Verifica si el token está cerca de expirar (dentro de los próximos minutos)
     * Útil para refrescar proactivamente antes de que expire
     */
    public function isExpiringSoon(User $user, int $minutesBeforeExpiry = 5): bool
    {
        if (!$user->token_expires_at) {
            // Si no hay fecha de expiración, asumimos que está expirado o cerca de expirar
            return true;
        }

        // Refrescar si el token expira en los próximos N minutos
        $threshold = now()->addMinutes($minutesBeforeExpiry);
        return $user->token_expires_at->lessThanOrEqualTo($threshold);
    }

    /**
     * Obtiene un token válido, refrescándolo si es necesario
     * Refresca proactivamente si está cerca de expirar
     */
    public function getValidToken(User $user, int $refreshBeforeMinutes = 5): ?string
    {
        // Si el token está expirado o cerca de expirar, refrescarlo
        if ($this->isExpired($user) || $this->isExpiringSoon($user, $refreshBeforeMinutes)) {
            $refreshed = $this->refresh($user);
            if ($refreshed) {
                Log::info('startgg token refreshed proactively', [
                    'user_id' => $user->id,
                    'expires_at' => $user->token_expires_at?->toIso8601String(),
                ]);
                return $refreshed;
            }
            
            // Si el refresh falla y el token está expirado, retornar null
            if ($this->isExpired($user)) {
                Log::warning('startgg token expired and refresh failed', [
                    'user_id' => $user->id,
                    'expires_at' => $user->token_expires_at?->toIso8601String(),
                ]);
                return null;
            }
        }

        return $user->startgg_access_token;
    }
}
