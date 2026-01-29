<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Report;
use App\Models\User;
use App\Services\StartggClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminReportFlowTest extends TestCase
{
    use RefreshDatabase;

    private function createPendingReport(User $user): Report
    {
        $report = Report::create([
            'user_id' => $user->id,
            'event_id' => 10,
            'event_name' => 'Event',
            'set_id' => 'set-1',
            'round' => 'Winners R1',
            'best_of' => 3,
            'p1_entrant_id' => 111,
            'p1_name' => 'Player 1',
            'p2_entrant_id' => 222,
            'p2_name' => 'Player 2',
            'score_p1' => 2,
            'score_p2' => 0,
            'status' => 'pending',
            'notes' => 'Notes',
        ]);

        Game::create([
            'report_id' => $report->id,
            'game_index' => 1,
            'stage' => 'Battlefield',
            'winner' => 'p1',
            'stocks_p1' => 2,
            'stocks_p2' => 0,
        ]);

        return $report;
    }

    public function test_admin_routes_require_admin_role(): void
    {
        $user = User::factory()->create(['role' => 'competitor']);
        Sanctum::actingAs($user);

        $this->getJson('/api/admin/reports')->assertStatus(403);
    }

    public function test_admin_can_list_and_view_reports(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reporter = User::factory()->create(['role' => 'competitor']);
        $report = $this->createPendingReport($reporter);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/reports')
            ->assertOk()
            ->assertJsonFragment(['id' => $report->id]);

        $this->getJson('/api/admin/reports/' . $report->id)
            ->assertOk()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('games.0.stage', 'Battlefield');
    }

    public function test_admin_can_approve_report(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reporter = User::factory()->create(['role' => 'competitor']);
        $report = $this->createPendingReport($reporter);

        Sanctum::actingAs($admin);

        $this->mock(StartggClient::class, function ($mock) use ($admin, $report) {
            $mock->shouldReceive('reportSet')
                ->once()
                ->with(
                    $admin,
                    $report->set_id,
                    $report->p1_entrant_id,
                    \Mockery::type(Report::class)
                );
        });

        $this->postJson('/api/admin/reports/' . $report->id . '/approve')
            ->assertOk()
            ->assertJsonPath('message', 'Report approved and submitted to start.gg');

        $this->assertSame('approved', $report->fresh()->status);
    }

    public function test_admin_can_reject_report(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reporter = User::factory()->create(['role' => 'competitor']);
        $report = $this->createPendingReport($reporter);

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/reports/' . $report->id . '/reject', ['reason' => 'Invalid'])
            ->assertOk()
            ->assertJsonPath('message', 'Report rejected');

        $this->assertSame('rejected', $report->fresh()->status);
    }
}

