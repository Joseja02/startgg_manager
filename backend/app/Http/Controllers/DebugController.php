<?php

namespace App\Http\Controllers;

use App\Services\StartggClient;
use Illuminate\Support\Facades\Log;

class DebugController extends Controller
{
    public function __construct(private StartggClient $client) {}

    /**
     * Get raw tournaments data without any filtering
     */
    public function tournamentsRaw()
    {
        // Get first user for debugging (should be the authenticated user in production)
        $user = \App\Models\User::first();
        
        if (!$user) {
            return response()->json(['error' => 'No user found'], 404);
        }

        // First, check if we can get basic user info
        $userInfoQuery = <<<'GQL'
        query CheckUser {
          currentUser {
            id
            slug
            name
          }
        }
        GQL;

        try {
          // Use debugQuery to capture raw response for troubleshooting
            $userCheckRaw = $this->client->debugQuery($user, $userInfoQuery, []);
            $userCheck = $userCheckRaw['json'] ?? [];
            // GraphQL responses are wrapped in `data`.
            $currentUserId = data_get($userCheck, 'data.currentUser.id');

            if (!$currentUserId) {
                return response()->json([
                    'error' => 'Cannot fetch currentUser - token may be invalid or expired',
                    'user' => [
                        'db_id' => $user->id,
                        'startgg_user_id' => $user->startgg_user_id,
                        'token_exists' => !empty($user->startgg_access_token),
                        'token_length' => strlen($user->startgg_access_token ?? ''),
                    ],
                    'api_response' => $userCheck,
                ], 401);
            }

            // Now get tournaments
            $tournamentsQuery = <<<'GQL'
            query AllTournaments($page: Int, $perPage: Int) {
              currentUser {
                id
                slug
                tournaments(query: {
                  page: $page
                  perPage: $perPage
                }) {
                  nodes {
                    id
                    name
                    slug
                    startAt
                    endAt
                    events {
                      id
                      name
                      startAt
                      isOnline
                      state
                      videogame {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
            GQL;

            $tournamentsRaw = $this->client->debugQuery($user, $tournamentsQuery, ['page' => 1, 'perPage' => 50]);
            $data = $tournamentsRaw['json'] ?? [];
            // GraphQL responses are under `data`
            $tournaments = data_get($data, 'data.currentUser.tournaments.nodes', []);

            Log::info('Debug tournaments raw', [
                'user_id' => $user->id,
                'startgg_user_id' => $user->startgg_user_id,
                'api_current_user_id' => $currentUserId,
                'tournament_count' => count($tournaments),
            ]);

            return response()->json([
                'user' => [
                    'db_id' => $user->id,
                    'startgg_user_id' => $user->startgg_user_id,
                    'api_user_id' => $currentUserId,
                    'token_exists' => !empty($user->startgg_access_token),
                ],
                'current_timestamp' => time(),
                'current_date' => date('Y-m-d H:i:s'),
                'total_tournaments' => count($tournaments),
              'tournaments' => $tournaments,
              'raw_user_check' => $userCheckRaw ?? null,
              'raw_tournaments' => $tournamentsRaw ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching tournaments', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'token_exists' => !empty($user->startgg_access_token),
            ], 500);
        }
    }

    /**
     * Get user info from start.gg API
     */
    public function userInfo()
    {
        $user = \App\Models\User::first();
        
        if (!$user) {
            return response()->json(['error' => 'No user found'], 404);
        }

        $query = <<<'GQL'
        query UserInfo {
          currentUser {
            id
            slug
            name
            player {
              id
              gamerTag
            }
            authorizations {
              id
              externalUsername
              type
            }
          }
        }
        GQL;

        try {
            $data = $this->client->query($user, $query, []);

            return response()->json([
                'db_user' => [
                    'id' => $user->id,
                    'startgg_user_id' => $user->startgg_user_id,
                    'name' => $user->name,
                    'token_exists' => !empty($user->startgg_access_token),
                ],
                'api_user' => $data['currentUser'] ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user info', ['error' => $e->getMessage()]);

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
