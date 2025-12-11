<?php

return [
    'client_id' => env('STARTGG_CLIENT_ID'),
    'client_secret' => env('STARTGG_CLIENT_SECRET'),
    'redirect_uri' => env('STARTGG_REDIRECT_URI', env('APP_URL') . '/auth/callback'),
    'oauth_authorize_url' => env('STARTGG_OAUTH_AUTHORIZE_URL', 'https://start.gg/oauth/authorize'),
    'oauth_token_url' => env('STARTGG_OAUTH_TOKEN_URL', 'https://start.gg/oauth/token'),
    'api_url' => env('STARTGG_API_URL', 'https://api.start.gg/gql/alpha'),
    'api_url_oauth' => env('STARTGG_API_URL_OAUTH', 'https://api.start.gg/gql/alpha'), // OAuth tokens use alpha
];
