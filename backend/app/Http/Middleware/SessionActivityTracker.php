<?php

namespace App\Http\Middleware;

use App\Services\SessionManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware pour vérifier l'expiration de session (idle timeout)
 * et mettre à jour la dernière activité
 */
class SessionActivityTracker
{
    public function __construct(
        private SessionManager $sessionManager
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if ($user && $user->currentAccessToken()) {
            $token = $user->currentAccessToken();
            
            // Vérifier si la session est expirée (idle timeout)
            if ($this->sessionManager->isSessionExpired($token)) {
                // Supprimer le token expiré
                $token->delete();
                
                return response()->json([
                    'message' => 'Session expirée pour inactivité. Veuillez vous reconnecter.',
                    'error' => 'session_expired',
                    'reason' => 'idle_timeout',
                ], 401);
            }
            
            // Mettre à jour la dernière activité
            $this->sessionManager->updateLastActivity($token);
        }

        return $next($request);
    }
}
