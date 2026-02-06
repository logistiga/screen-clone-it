<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        try {
            if (!$request->user()->hasPermissionTo($permission)) {
                return response()->json([
                    'message' => 'Vous n\'avez pas la permission d\'effectuer cette action'
                ], 403);
            }
        } catch (PermissionDoesNotExist $e) {
            // La permission n'existe pas encore en base (seeder pas exécuté).
            // Retourner 403 au lieu de crasher en 500.
            return response()->json([
                'message' => "Permission '{$permission}' non configurée. Contactez l'administrateur.",
                'error' => 'permission_not_found',
            ], 403);
        }

        return $next($request);
    }
}
