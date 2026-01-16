<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SessionManager;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SessionController extends Controller
{
    public function __construct(
        private SessionManager $sessionManager
    ) {}

    /**
     * Liste toutes les sessions actives de l'utilisateur
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $sessions = $this->sessionManager->getActiveSessions($user);
        $stats = $this->sessionManager->getSessionStats($user);

        return response()->json([
            'sessions' => $sessions,
            'stats' => $stats,
        ]);
    }

    /**
     * Révoquer une session spécifique
     */
    public function destroy(Request $request, int $sessionId): JsonResponse
    {
        $user = $request->user();
        
        // Vérifier si c'est la session actuelle
        if ($user->currentAccessToken()?->id === $sessionId) {
            return response()->json([
                'message' => 'Utilisez la déconnexion pour terminer votre session actuelle.',
                'error' => 'cannot_revoke_current_session',
            ], 422);
        }

        $success = $this->sessionManager->revokeSession($user, $sessionId);

        if (!$success) {
            return response()->json([
                'message' => 'Session non trouvée.',
                'error' => 'session_not_found',
            ], 404);
        }

        Audit::log('revoke_session', 'security', "Session {$sessionId} révoquée");

        return response()->json([
            'message' => 'Session révoquée avec succès.',
        ]);
    }

    /**
     * Révoquer toutes les autres sessions
     */
    public function revokeOthers(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $count = $this->sessionManager->revokeOtherSessions($user);

        Audit::log('revoke_all_sessions', 'security', "{$count} sessions révoquées");

        return response()->json([
            'message' => "{$count} session(s) révoquée(s) avec succès.",
            'revoked_count' => $count,
        ]);
    }

    /**
     * Révoquer toutes les sessions (déconnexion globale)
     * L'utilisateur devra se reconnecter
     */
    public function revokeAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $count = $this->sessionManager->revokeAllSessions($user);

        Audit::log('revoke_all_sessions', 'security', "Déconnexion globale - {$count} sessions révoquées");

        return response()->json([
            'message' => 'Toutes les sessions ont été révoquées. Veuillez vous reconnecter.',
            'revoked_count' => $count,
        ]);
    }

    /**
     * Obtenir les informations de la session actuelle
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $user->currentAccessToken();

        if (!$token) {
            return response()->json([
                'message' => 'Aucune session active.',
            ], 404);
        }

        return response()->json([
            'session' => [
                'id' => $token->id,
                'name' => $token->name,
                'ip_address' => $token->ip_address,
                'device_type' => $token->device_type ?? 'unknown',
                'browser' => $token->browser ?? 'Unknown',
                'platform' => $token->platform ?? 'Unknown',
                'location' => $token->location,
                'last_active_at' => $token->last_active_at?->toIso8601String(),
                'created_at' => $token->created_at->toIso8601String(),
                'is_current' => true,
            ],
        ]);
    }
}
