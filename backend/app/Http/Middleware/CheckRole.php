<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if (!$request->user()->hasAnyRole($roles)) {
            return response()->json([
                'message' => 'Vous n\'avez pas le rôle requis pour cette action'
            ], 403);
        }

        return $next($request);
    }
}
