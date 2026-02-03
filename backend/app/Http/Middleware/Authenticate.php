<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     * Return null for API requests to trigger 401 JSON response instead of redirect.
     */
    protected function redirectTo(Request $request): ?string
    {
        // API requests: return null to prevent redirect to login route
        // This will trigger a 401 Unauthenticated JSON response
        if (! $request->expectsJson()) {
            return null;
        }
        
        return null;
    }
}
