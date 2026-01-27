<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Report;
use App\Services\StartggClient;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    public function __construct(private StartggClient $client) {}

    /**
     * Listar reportes (admin)
     * GET /api/admin/reports
     */
    public function index(Request $request)
    {
        $query = Report::with(['user', 'games'])
            ->orderBy('created_at', 'desc');

        // Filtrar por estado
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $reports = $query->get()->map(function ($report) {
            return [
                'id' => $report->id,
                'eventId' => $report->event_id,
                'eventName' => $report->event_name,
                'setId' => $report->set_id,
                'round' => $report->round,
                'p1' => [
                    'entrantId' => $report->p1_entrant_id,
                    'name' => $report->p1_name,
                ],
                'p2' => [
                    'entrantId' => $report->p2_entrant_id,
                    'name' => $report->p2_name,
                ],
                'scoreP1' => $report->score_p1,
                'scoreP2' => $report->score_p2,
                'status' => $report->status,
                'submittedBy' => $report->user->name,
                'createdAt' => $report->created_at->toIso8601String(),
            ];
        });

        return response()->json($reports);
    }

    /**
     * Obtener detalle de un reporte (admin)
     * GET /api/admin/reports/{reportId}
     */
    public function show($reportId)
    {
        $report = Report::with(['user', 'games'])->findOrFail($reportId);

        $reportDetail = [
            'id' => $report->id,
            'eventId' => $report->event_id,
            'eventName' => $report->event_name,
            'setId' => $report->set_id,
            'round' => $report->round,
            'bestOf' => $report->best_of,
            'p1' => [
                'entrantId' => $report->p1_entrant_id,
                'name' => $report->p1_name,
            ],
            'p2' => [
                'entrantId' => $report->p2_entrant_id,
                'name' => $report->p2_name,
            ],
            'scoreP1' => $report->score_p1,
            'scoreP2' => $report->score_p2,
            'status' => $report->status,
            'submittedBy' => $report->user->name,
            'createdAt' => $report->created_at->toIso8601String(),
            'notes' => $report->notes,
            'rejectionReason' => $report->rejection_reason,
            'games' => $report->games->map(function ($game) {
                return [
                    'index' => $game->game_index,
                    'stage' => $game->stage,
                    'winner' => $game->winner,
                    'stocksP1' => $game->stocks_p1,
                    'stocksP2' => $game->stocks_p2,
                    'characterP1' => $game->character_p1,
                    'characterP2' => $game->character_p2,
                ];
            }),
        ];

        return response()->json($reportDetail);
    }

    /**
     * Aprobar un reporte (admin)
     * POST /api/admin/reports/{reportId}/approve
     */
    public function approve(Request $request, $reportId)
    {
        $user = Auth::user();
        $report = Report::with('games')->findOrFail($reportId);

        if ($report->status !== 'pending') {
            return response()->json([
                'error' => 'Report is not pending',
            ], 400);
        }

        try {
            // Reportar el set a start.gg
            $winnerId = $report->score_p1 > $report->score_p2 
                ? $report->p1_entrant_id 
                : $report->p2_entrant_id;

            // Llamar a start.gg API para reportar el set
            $this->client->reportSet(
                $user,
                $report->set_id,
                $winnerId,
                $report
            );

            // Marcar como aprobado
            $report->approve();

            return response()->json([
                'message' => 'Report approved and submitted to start.gg',
                'report' => $report,
            ]);
            
        } catch (\Throwable $e) {
            Log::error('Error approving report', [
                'report_id' => $reportId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to approve report',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rechazar un reporte (admin)
     * POST /api/admin/reports/{reportId}/reject
     */
    public function reject(Request $request, $reportId)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $report = Report::findOrFail($reportId);

        if ($report->status !== 'pending') {
            return response()->json([
                'error' => 'Report is not pending',
            ], 400);
        }

        $report->reject($request->input('reason'));

        return response()->json([
            'message' => 'Report rejected',
            'report' => $report,
        ]);
    }
}

