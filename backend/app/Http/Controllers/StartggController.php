<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class StartggController extends Controller
{
    public function login(Request $request)
    {
        $state = Str::random(32);
        $request->session()->put('oauth_state', $state);

        $params = http_build_query([
            'client_id' => config('startgg.client_id'),
            'redirect_uri' => config('startgg.redirect_uri'),
            'response_type' => 'code',
            // Añadimos el scope necesario para reportar/gestionar sets
            'scope' => 'user.identity user.email tournament.reporter',
            'state' => $state,
        ]);

        $authorizeUrl = rtrim(config('startgg.oauth_authorize_url'), '?') . '?' . $params;
        return redirect()->away($authorizeUrl);
    }

    public function callback(Request $request)
    {
        $state = $request->session()->pull('oauth_state');
        if (!$state || $state !== $request->query('state')) {
            return response()->json(['error' => 'Invalid state'], 400);
        }

        $code = $request->query('code');
        if (!$code) {
            return response()->json(['error' => 'Missing authorization code'], 400);
        }

        // Intercambiar authorization code por access token
        // Documentación: https://developer.start.gg/docs/oauth/oauth-overview
        $tokenResponse = Http::asForm()->post('https://api.start.gg/oauth/access_token', [
            'grant_type' => 'authorization_code',
            'client_id' => config('startgg.client_id'),
            'client_secret' => config('startgg.client_secret'),
            'code' => $code,
            'redirect_uri' => config('startgg.redirect_uri'),
        ]);

        if ($tokenResponse->failed()) {
            Log::error('startgg token error', [
                'status' => $tokenResponse->status(),
                'body' => $tokenResponse->body(),
            ]);
            return response()->json(['error' => 'Token exchange failed'], 500);
        }

        $tokenData = $tokenResponse->json();
        $accessToken = $tokenData['access_token'] ?? null;
        $refreshToken = $tokenData['refresh_token'] ?? null;
        $expiresIn = $tokenData['expires_in'] ?? null;

        if (!$accessToken) {
            Log::error('startgg no access token', ['response' => $tokenData]);
            return response()->json(['error' => 'No access token received'], 500);
        }

        // Obtener usuario actual de start.gg via GraphQL
        $userQuery = <<<'GQL'
        query {
          currentUser {
            id
            email
            player {
              id
              gamerTag
              prefix
            }
          }
        }
        GQL;

        $graphqlResponse = Http::withToken($accessToken)
            ->acceptJson()
            ->post(config('startgg.api_url_oauth'), [
                'query' => $userQuery,
            ]);

        if ($graphqlResponse->failed()) {
            Log::error('startgg graphql user error', [
                'status' => $graphqlResponse->status(),
                'body' => $graphqlResponse->body(),
            ]);
            return response()->json(['error' => 'Failed to fetch user'], 500);
        }

        $userData = data_get($graphqlResponse->json(), 'data.currentUser');

        // Persistir/actualizar usuario local con tokens de start.gg
        $startggUserId = data_get($userData, 'id');
        $email = data_get($userData, 'email');
        $gamerTag = data_get($userData, 'player.gamerTag');

        $existingUser = User::where('startgg_user_id', (string) $startggUserId)->first();
        $role = $existingUser?->role ?? 'competitor';

        $user = User::query()->updateOrCreate(
            ['startgg_user_id' => (string) $startggUserId],
            [
                'name' => $gamerTag ?: ('user_'.$startggUserId),
                'email' => $email ?: ('user_'.$startggUserId.'@startgg.local'),
                'password' => bcrypt(Str::random(32)), // Password aleatorio (no se usará, solo OAuth)
                'startgg_access_token' => $accessToken,
                'startgg_refresh_token' => $refreshToken,
                'token_expires_at' => $expiresIn ? Carbon::now()->addSeconds((int) $expiresIn) : null,
                'role' => $role,
            ]
        );

        // Crear token de API para el frontend
        $apiToken = $user->createToken('web-app')->plainTextToken;

        // Redirigir al frontend con el token
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:8080');
        
        return redirect()->away(rtrim($frontendUrl, '/') . '/auth/callback?token=' . $apiToken);
    }
}
