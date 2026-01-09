<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        if (!$request->user()->hasPermissionTo($permission)) {
            return response()->json([
                'message' => 'Vous n\'avez pas la permission d\'effectuer cette action'
            ], 403);
        }

        return $next($request);
    }
}
