<?php

return [

    'paths' => [
        'api/*',
        'auth/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'https://startgg-manager-frontend-production.up.railway.app:8080'),
        // Permitir localhost en desarrollo local
        env('APP_ENV') === 'local' ? 'http://localhost:8080' : null,
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
