<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\StartggClient;
use App\Services\StartggAppClient;
use App\Models\Report;
use App\Models\SetState;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class EventController extends Controller
{
    public function __construct(private StartggClient $client, private StartggAppClient $appClient) {}

    /**
     * Obtener los sets de un evento
     * GET /api/events/{eventId}/sets
     */
    public function getSets(Request $request, $eventId)
    {
        $user = Auth::user();
        
        $mine = $request->boolean('mine');
        $statusFilter = $request->query('status');
        $cacheKey = "event_{$eventId}_sets_" . ($mine ? "user_{$user->id}" : 'all');
        $cacheKey .= $statusFilter ? "_status_{$statusFilter}" : '';
        
        try {
            $sets = Cache::remember($cacheKey, now()->addMinutes(2), function () use ($user, $eventId, $request) {
                $mine = $request->boolean('mine');
                $statusFilter = $request->query('status');

                $sets = $this->client->getEventSets($user, $eventId, [
                    'mine' => $mine,
                    'status' => $statusFilter,
                ]);

                // Enriquecer con información de reportes locales para evitar duplicados
                $setIds = array_column($sets, 'id');
                $reports = Report::whereIn('set_id', $setIds)
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->groupBy('set_id');
                $states = SetState::whereIn('set_id', $setIds)
                    ->get()
                    ->keyBy('set_id');

                $startggUserId = $user?->startgg_user_id;

                $mapped = array_map(function (array $set) use ($reports, $states, $mine, $startggUserId) {
                    $report = $reports[$set['id']][0] ?? null;
                    $state = $states->get($set['id']);
                    if ($state?->best_of) {
                        $set['bestOf'] = (int) $state->best_of;
                    }

                    if ($report) {
                        $set['status'] = match ($report->status) {
                            'pending' => 'reported',
                            'approved' => 'approved',
                            'rejected' => 'rejected',
                            default => $set['status'],
                        };
                        $set['reportStatus'] = $report->status;
                    }

                    // Filtrar por sets del usuario si se pide "mine"
                    if ($mine && $startggUserId) {
                        $isMine = (string)($set['p1']['userId'] ?? '') === (string)$startggUserId
                            || (string)($set['p2']['userId'] ?? '') === (string)$startggUserId;
                        if (!$isMine) {
                            return null;
                        }
                    }

                    return $set;
                }, $sets);

                // Quitar los nulos generados por filtrado
                $filteredSets = array_values(array_filter($mapped));

                // Aplicar filtro por estado si corresponde
                if ($statusFilter) {
                    $filteredSets = array_values(array_filter($filteredSets, function ($set) use ($statusFilter) {
                        return $set['status'] === $statusFilter;
                    }));
                }

                return $filteredSets;
            });

            return response()->json($sets);
        } catch (\Throwable $e) {
            Log::error('Error fetching event sets', [
                'event_id' => $eventId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to fetch event sets',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener detalles de un evento
     * GET /api/events/{eventId}
     */
    public function show(Request $request, $eventId)
    {
        $user = Auth::user();
        
        $cacheKey = "event_{$eventId}_detail";
        
        try {
            $event = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($user, $eventId) {
                return $this->client->getEvent($user, $eventId);
            });

            return response()->json($event);
        } catch (\Throwable $e) {
            Log::error('Error fetching event', [
                'event_id' => $eventId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to fetch event',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar si el usuario actual es admin del torneo del evento
     * GET /api/events/{eventId}/admin-check
     */
    public function adminCheck(Request $request, $eventId)
    {
        $user = Auth::user();
        /** @var \App\Models\User $user */

        if (!$user?->startgg_user_id) {
            return response()->json(['isAdmin' => false, 'reason' => 'missing_startgg_user_id']);
        }

        $startggUserId = (string) $user->startgg_user_id;
        $promoted = false;

        // Permitir que el frontend pase el slug para evitar una consulta extra
        $slug = $request->query('tournamentSlug');

        if (!$slug) {
            // Fallback: obtener detalles del evento para conseguir el slug (cacheado 5m)
            try {
                $cacheKey = "event_{$eventId}_detail";
                $event = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($user, $eventId) {
                    return $this->client->getEvent($user, $eventId);
                });
                $slug = data_get($event, 'tournamentSlug') ?? data_get($event, 'tournamentName');
            } catch (\Throwable $e) {
                Log::error('adminCheck: failed to resolve slug from event', [
                    'event_id' => $eventId,
                    'error' => $e->getMessage(),
                ]);
                return response()->json(['isAdmin' => false, 'reason' => 'slug_unavailable'], 500);
            }
        }

        if (!$slug) {
            return response()->json(['isAdmin' => false, 'reason' => 'slug_missing'], 400);
        }

        $matchAdmin = function ($ownerId, array $adminIds) use ($startggUserId) {
            return ($ownerId && (string) $ownerId === $startggUserId)
                || collect($adminIds)->contains(fn ($id) => (string) $id === $startggUserId);
        };

        // 1) Intentar con el token de la app (PAT)
        $appInfo = $this->appClient->getTournamentAdminInfo($slug);
        $ownerIdApp = $appInfo['ownerId'] ?? null;
        $adminIdsApp = collect($appInfo['adminUserIds'] ?? [])
            ->map(fn ($id) => (string) $id)
            ->filter()
            ->values()
            ->all();

        // Fallback: if no userIds were provided, map from admins array (id or user.id)
        if (count($adminIdsApp) === 0) {
            $adminIdsApp = collect($appInfo['admins'] ?? [])
            ->map(function ($admin) {
                return (string) (data_get($admin, 'id') ?? data_get($admin, 'user.id'));
            })
            ->filter()
            ->values()
            ->all();
        }

        $isAdmin = $matchAdmin($ownerIdApp, $adminIdsApp);

        // 2) Consultar el evento con token de usuario (sin cache) para usar event.isAdmin
        $ownerIdViaUser = null;
        $adminIdsViaUser = [];
        $isAdminViaFlag = false;
        if (!$isAdmin) {
            try {
                $eventDetail = $this->client->getEvent($user, $eventId);
                if (!empty($eventDetail['isAdminEvent'])) {
                    $isAdmin = true;
                }
                // guardar owner del torneo para logging
                $ownerIdViaUser = data_get($eventDetail, 'tournamentOwner');
            } catch (\Throwable $e) {
                Log::warning('adminCheck fallback event isAdmin failed', [
                    'event_id' => $eventId,
                    'slug' => $slug,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // 3) Fallback adicional: usar el token OAuth del usuario para obtener owner + admins delegados
        if (!$isAdmin) {
            try {
                $userAdminInfo = $this->client->getTournamentAdminInfo($user, $slug);
                $ownerIdViaUser = $ownerIdViaUser ?? ($userAdminInfo['ownerId'] ?? null);
                $adminIdsViaUser = $userAdminInfo['adminIds'] ?? [];
                $isAdminViaFlag = (bool) ($userAdminInfo['isAdmin'] ?? false);
                $isAdmin = $matchAdmin($ownerIdViaUser, $adminIdsViaUser);
                if (!$isAdmin && $isAdminViaFlag) {
                    $isAdmin = true; // current user flagged as admin by API
                }
            } catch (\Throwable $e) {
                Log::warning('adminCheck fallback admins via user token failed', [
                    'event_id' => $eventId,
                    'slug' => $slug,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($isAdmin && $user->role !== 'admin') {
            $user->role = 'admin';
            $user->save();
            $promoted = true;
            Log::info('adminCheck: user promoted to admin role', [
                'user_id' => $user->id,
                'startgg_user_id' => $startggUserId,
                'event_id' => $eventId,
                'slug' => $slug,
            ]);
        }

        Log::info('adminCheck result', [
            'event_id' => $eventId,
            'slug' => $slug,
            'user_id' => $user->id,
            'startgg_user_id' => $user->startgg_user_id,
            'is_admin' => $isAdmin,
            'owner_app' => $ownerIdApp,
            'admins_app_count' => count($adminIdsApp),
            'owner_via_user' => $ownerIdViaUser,
            'admins_user_count' => count($adminIdsViaUser),
            'is_admin_via_flag' => $isAdminViaFlag,
            'promoted' => $promoted,
        ]);

        return response()->json([
            'isAdmin' => $isAdmin,
            'slug' => $slug,
            'promoted' => $promoted,
        ]);
    }
}

