<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\StartggAuth;
use App\Services\StartggClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use RuntimeException;
use Tests\TestCase;

class StartggClientTest extends TestCase
{
    use RefreshDatabase;
    use MockeryPHPUnitIntegration;

    public function test_query_refreshes_token_on_unauthorized(): void
    {
        config()->set('startgg.api_url_oauth', 'https://api.start.gg/gql/alpha');

        Http::fakeSequence('https://api.start.gg/gql/alpha')
            ->push([], 401)
            ->push(['data' => ['ok' => true]], 200);

        $auth = Mockery::mock(StartggAuth::class);
        $auth->shouldReceive('refresh')->once()->andReturn('new-token');

        $client = new StartggClient($auth);
        $user = User::factory()->create(['startgg_access_token' => 'old-token']);

        $data = $client->query($user, 'query { ok }');

        $this->assertSame(['ok' => true], $data);
        Http::assertSentCount(2);
    }

    public function test_get_event_sets_filters_and_maps_results(): void
    {
        $auth = Mockery::mock(StartggAuth::class);
        $client = Mockery::mock(StartggClient::class, [$auth])->makePartial();

        $client->shouldReceive('query')->andReturn([
            'event' => [
                'name' => 'Test Event',
                'phases' => [
                    [
                        'sets' => [
                            'nodes' => [
                                [
                                    'id' => 'set-1',
                                    'fullRoundText' => 'Winners R1',
                                    'round' => 1,
                                    'state' => 2,
                                    'slots' => [
                                        [
                                            'entrant' => [
                                                'id' => 'e1',
                                                'name' => 'Player 1',
                                                'participants' => [['user' => ['id' => 11]]],
                                            ],
                                        ],
                                        [
                                            'entrant' => [
                                                'id' => 'e2',
                                                'name' => 'Player 2',
                                                'participants' => [['user' => ['id' => 22]]],
                                            ],
                                        ],
                                    ],
                                ],
                                [
                                    'id' => 'set-2',
                                    'fullRoundText' => 'Losers R1',
                                    'round' => 1,
                                    'state' => 1,
                                    'slots' => [
                                        [
                                            'entrant' => [
                                                'id' => 'e3',
                                                'name' => 'TBD',
                                                'participants' => [['user' => ['id' => 33]]],
                                            ],
                                        ],
                                        [
                                            'entrant' => [
                                                'id' => 'e4',
                                                'name' => 'Player 4',
                                                'participants' => [['user' => ['id' => 44]]],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $user = User::factory()->create();
        $sets = $client->getEventSets($user, 123);

        $this->assertCount(1, $sets);
        $this->assertSame('set-1', $sets[0]['id']);
        $this->assertSame('in_progress', $sets[0]['status']);
        $this->assertSame('Player 1', $sets[0]['p1']['name']);
        $this->assertSame('Player 2', $sets[0]['p2']['name']);
    }

    public function test_mark_set_in_progress_throws_on_empty_result(): void
    {
        $auth = Mockery::mock(StartggAuth::class);
        $client = Mockery::mock(StartggClient::class, [$auth])->makePartial();

        $client->shouldReceive('query')->andReturn(['markSetInProgress' => null]);
        $client->shouldReceive('debugQuery')->andReturn([
            'json' => ['errors' => [['message' => 'Missing scope']]],
        ]);

        $user = User::factory()->create(['startgg_access_token' => 'token']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Failed to mark set in progress: Missing scope');

        $client->markSetInProgress($user, 'set-123');
    }
}

