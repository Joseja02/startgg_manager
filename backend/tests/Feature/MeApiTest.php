<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\StartggClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_me_returns_user_payload(): void
    {
        $user = User::factory()->create([
            'name' => 'Jose',
            'role' => 'admin',
            'startgg_user_id' => '11',
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJson([
                'id' => $user->id,
                'name' => 'Jose',
                'role' => 'admin',
                'startgg_user_id' => '11',
            ]);
    }

    public function test_me_events_uses_cache_and_returns_events(): void
    {
        Cache::flush();
        $user = User::factory()->create([
            'name' => 'Jose',
            'role' => 'competitor',
            'startgg_user_id' => '22',
        ]);
        Sanctum::actingAs($user);

        $events = [
            [
                'id' => 'event-1',
                'name' => 'Event One',
                'game' => 'smash_ultimate',
                'tournamentName' => 'Tournament',
                'startAt' => 123,
                'status' => 'active',
            ],
        ];

        $this->mock(StartggClient::class, function ($mock) use ($events) {
            $mock->shouldReceive('getUserEvents')->once()->andReturn($events);
        });

        $this->getJson('/api/me/events')->assertOk()->assertJson($events);
        $this->getJson('/api/me/events')->assertOk()->assertJson($events);
    }
}

