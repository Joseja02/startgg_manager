<?php

namespace Tests\Feature;

use App\Models\Report;
use App\Models\User;
use App\Services\StartggClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SetFlowTest extends TestCase
{
    use RefreshDatabase;

    private function mockSetDetail(string $userId): array
    {
        return [
            'id' => 'set-1',
            'eventId' => 10,
            'eventName' => 'Event',
            'round' => 'Winners R1',
            'bestOf' => 3,
            'p1' => [
                'userId' => $userId,
                'entrantId' => 111,
                'name' => 'Player 1',
            ],
            'p2' => [
                'userId' => '99',
                'entrantId' => 222,
                'name' => 'Player 2',
            ],
        ];
    }

    public function test_submit_report_creates_report_and_games(): void
    {
        $user = User::factory()->create([
            'startgg_user_id' => '55',
            'role' => 'competitor',
        ]);
        Sanctum::actingAs($user);

        $this->mock(StartggClient::class, function ($mock) use ($user) {
            $mock->shouldReceive('getSetDetail')->andReturn($this->mockSetDetail($user->startgg_user_id));
        });

        $payload = [
            'games' => [
                [
                    'index' => 1,
                    'stage' => 'Battlefield',
                    'winner' => 'p1',
                    'stocksP1' => 2,
                    'stocksP2' => 0,
                    'characterP1' => 'mario',
                    'characterP2' => 'fox',
                ],
                [
                    'index' => 2,
                    'stage' => 'Final Destination',
                    'winner' => 'p1',
                    'stocksP1' => 1,
                    'stocksP2' => 0,
                    'characterP1' => 'mario',
                    'characterP2' => 'fox',
                ],
            ],
            'notes' => 'Good set',
        ];

        $this->postJson('/api/sets/set-1/submit', $payload)
            ->assertStatus(201)
            ->assertJsonPath('report.status', 'pending');

        $this->assertSame(1, Report::count());
        $this->assertSame(2, Report::first()->games()->count());
    }

    public function test_submit_report_rejects_non_participant(): void
    {
        $user = User::factory()->create([
            'startgg_user_id' => '55',
            'role' => 'competitor',
        ]);
        Sanctum::actingAs($user);

        $this->mock(StartggClient::class, function ($mock) {
            $mock->shouldReceive('getSetDetail')->andReturn([
                'id' => 'set-1',
                'eventId' => 10,
                'eventName' => 'Event',
                'round' => 'Winners R1',
                'bestOf' => 3,
                'p1' => ['userId' => '1', 'entrantId' => 111, 'name' => 'Player 1'],
                'p2' => ['userId' => '2', 'entrantId' => 222, 'name' => 'Player 2'],
            ]);
        });

        $payload = [
            'games' => [
                [
                    'index' => 1,
                    'stage' => 'Battlefield',
                    'winner' => 'p1',
                    'stocksP1' => 2,
                    'stocksP2' => 0,
                ],
            ],
        ];

        $this->postJson('/api/sets/set-1/submit', $payload)
            ->assertStatus(403)
            ->assertJsonPath('error', 'Unauthorized');
    }

    public function test_submit_report_validates_payload(): void
    {
        $user = User::factory()->create([
            'startgg_user_id' => '55',
            'role' => 'competitor',
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/sets/set-1/submit', [])
            ->assertStatus(422)
            ->assertJsonPath('error', 'Validation failed');
    }

    public function test_start_set_returns_success(): void
    {
        $user = User::factory()->create([
            'startgg_user_id' => '55',
            'role' => 'competitor',
        ]);
        Sanctum::actingAs($user);

        $this->mock(StartggClient::class, function ($mock) use ($user) {
            $mock->shouldReceive('getSetDetail')->andReturn($this->mockSetDetail($user->startgg_user_id));
            $mock->shouldReceive('markSetInProgress')->andReturn(['id' => 'set-1', 'state' => 2]);
        });

        $this->postJson('/api/sets/set-1/start')
            ->assertOk()
            ->assertJsonPath('message', 'Set marked as in progress');
    }
}

