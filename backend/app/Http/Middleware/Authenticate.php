<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // Para requests API o que esperan JSON, devolver null para que lance 401
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        // Para requests web, redirigir al login (si existiera una ruta 'login')
        return null; // Por ahora null ya que no tenemos ruta web de login
    }
}
