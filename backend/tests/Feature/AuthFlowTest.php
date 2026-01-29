<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_redirects_to_startgg_authorize_and_sets_state(): void
    {
        config()->set('startgg.client_id', 'client-id');
        config()->set('startgg.redirect_uri', 'http://localhost/auth/callback');
        config()->set('startgg.oauth_authorize_url', 'https://start.gg/oauth/authorize');

        $response = $this->get('/auth/login');

        $response->assertRedirect();
        $location = $response->headers->get('Location');

        $this->assertStringContainsString('https://start.gg/oauth/authorize?', $location);
        $this->assertStringContainsString('client_id=client-id', $location);
        $this->assertStringContainsString('redirect_uri=http%3A%2F%2Flocalhost%2Fauth%2Fcallback', $location);
        $this->assertStringContainsString('response_type=code', $location);
        $this->assertStringContainsString('scope=user.identity+user.email+tournament.reporter', $location);

        $response->assertSessionHas('oauth_state');
        $response->assertCookie('oauth_state_cookie');
    }
}

