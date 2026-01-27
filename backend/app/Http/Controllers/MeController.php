<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\StartggClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MeController extends Controller
{
    public function __construct(private StartggClient $client) {}

    public function me(Request $request)
    {
        $user = Auth::user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'startgg_user_id' => $user->startgg_user_id,
        ]);
    }

    public function events(Request $request)
    {
        $user = Auth::user();

        $cacheKey = 'me_events_v2_'.$user->id;
        $payload = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($user) {
            try {
                Log::info('Fetching events for user', ['user_id' => $user->id, 'startgg_user_id' => $user->startgg_user_id]);
                $events = $this->client->getUserEvents($user);
                Log::info('Events fetched successfully', ['count' => count($events), 'events' => $events]);
                return [
                    'events' => $events,
                ];
            } catch (\Throwable $e) {
                Log::error('me/events error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
                return [
                    'events' => [],
                ];
            }
        });

        return response()->json($payload['events']);
    }
}
