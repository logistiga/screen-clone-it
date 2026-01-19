<?php

namespace App\Http\Middleware;

use App\Services\SessionManager;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware pour vérifier l'expiration de session (idle timeout)
 * et mettre à jour la dernière activité.
 * 
 * Supporte à la fois :
 * - PersonalAccessToken (API token / Bearer)
 * - TransientToken (SPA cookie/session Sanctum)
 */
class SessionActivityTracker
{
    public function __construct(
        private SessionManager $sessionManager
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Si pas d'utilisateur authentifié, on continue
        if (!$user) {
            return $next($request);
        }

        $token = $user->currentAccessToken();
        
        // Si pas de token (ne devrait pas arriver si user est auth), on continue
        if (!$token) {
            return $next($request);
        }

        // Vérifier si la session est expirée (idle timeout)
        // Note: isSessionExpired gère correctement TransientToken (retourne false)
        if ($this->sessionManager->isSessionExpired($token)) {
            // Seul PersonalAccessToken peut être supprimé de la DB
            if ($token instanceof PersonalAccessToken) {
                $token->delete();
            }
            
            return response()->json([
                'message' => 'Session expirée pour inactivité. Veuillez vous reconnecter.',
                'error' => 'session_expired',
                'reason' => 'idle_timeout',
            ], 401);
        }
        
        // Mettre à jour la dernière activité
        // Note: updateLastActivity gère correctement TransientToken (no-op)
        $this->sessionManager->updateLastActivity($token);

        return $next($request);
    }
}
