<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        try {
            if (!$user->hasPermissionTo($permission)) {
                return response()->json([
                    'message' => 'Vous n\'avez pas la permission d\'effectuer cette action',
                    'permission_requise' => $permission
                ], 403);
            }
        } catch (\Spatie\Permission\Exceptions\PermissionDoesNotExist $e) {
            // La permission n'existe pas en base de données
            Log::warning("Permission non configurée: {$permission}", [
                'user_id' => $user->id,
                'email' => $user->email,
                'route' => $request->path(),
            ]);
            
            return response()->json([
                'message' => 'Permission non configurée sur le serveur',
                'permission' => $permission,
                'error_code' => 'PERMISSION_NOT_FOUND'
            ], 403);
        } catch (\Exception $e) {
            // Autre erreur inattendue
            Log::error("Erreur vérification permission: {$permission}", [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Erreur lors de la vérification des permissions',
                'error_code' => 'PERMISSION_CHECK_ERROR'
            ], 500);
        }

        return $next($request);
    }
}
