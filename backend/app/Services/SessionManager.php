<?php

namespace App\Services;

use Illuminate\Http\Request;
use Laravel\Sanctum\Contracts\HasAbilities;
use Laravel\Sanctum\NewAccessToken;
use Laravel\Sanctum\PersonalAccessToken;
use App\Models\User;

class SessionManager
{
    /**
     * Nombre maximum de sessions actives par utilisateur
     */
    private const MAX_SESSIONS_PER_USER = 5;

    /**
     * Durée d'inactivité avant expiration (en minutes)
     */
    private const IDLE_TIMEOUT_MINUTES = 60;

    /**
     * Créer une nouvelle session avec métadonnées
     */
    public function createSession(User $user, Request $request, string $tokenName = 'auth-token'): array
    {
        // Vérifier et appliquer la limite de sessions
        $this->enforceSessionLimit($user);

        // Créer le token
        $tokenResult = $user->createToken($tokenName);
        
        // Récupérer le token et ajouter les métadonnées
        $token = $tokenResult->accessToken;
        $this->updateTokenMetadata($token, $request);

        return [
            'token' => $tokenResult,
            'accessToken' => $token,
            'plainTextToken' => $tokenResult->plainTextToken,
        ];
    }

    /**
     * Mettre à jour les métadonnées du token
     */
    public function updateTokenMetadata(PersonalAccessToken $token, Request $request): void
    {
        $userAgent = $request->userAgent() ?? 'Unknown';
        $parsedAgent = $this->parseUserAgent($userAgent);

        $token->update([
            'ip_address' => $this->getClientIp($request),
            'user_agent' => substr($userAgent, 0, 500),
            'device_type' => $parsedAgent['device_type'],
            'browser' => $parsedAgent['browser'],
            'platform' => $parsedAgent['platform'],
            'last_active_at' => now(),
        ]);
    }

    /**
     * Mettre à jour la dernière activité
     * Accepte HasAbilities pour compatibilité SPA (TransientToken) et API (PersonalAccessToken)
     */
    public function updateLastActivity(HasAbilities $token): void
    {
        // Seul PersonalAccessToken a une table DB à mettre à jour
        if ($token instanceof PersonalAccessToken) {
            $token->update(['last_active_at' => now()]);
        }
        // TransientToken (SPA cookie) : pas de DB à mettre à jour, la session gère ça
    }

    /**
     * Vérifier si une session est expirée (idle timeout)
     * Accepte HasAbilities pour compatibilité SPA (TransientToken) et API (PersonalAccessToken)
     */
    public function isSessionExpired(HasAbilities $token): bool
    {
        // TransientToken (SPA cookie/session) : l'expiration est gérée par la session Laravel
        // On ne peut pas vérifier "last_active_at" en DB, donc on considère non-expiré ici
        if (!$token instanceof PersonalAccessToken) {
            return false;
        }

        // PersonalAccessToken : vérifier last_active_at en DB
        if (!$token->last_active_at) {
            return false;
        }

        return $token->last_active_at->addMinutes(self::IDLE_TIMEOUT_MINUTES)->isPast();
    }

    /**
     * Appliquer la limite de sessions
     */
    public function enforceSessionLimit(User $user): void
    {
        $activeSessions = $user->tokens()
            ->orderBy('last_active_at', 'desc')
            ->get();

        // Si on dépasse la limite, supprimer les sessions les plus anciennes
        if ($activeSessions->count() >= self::MAX_SESSIONS_PER_USER) {
            $sessionsToRemove = $activeSessions->slice(self::MAX_SESSIONS_PER_USER - 1);
            
            foreach ($sessionsToRemove as $session) {
                $session->delete();
            }
        }
    }

    /**
     * Obtenir toutes les sessions actives d'un utilisateur
     */
    public function getActiveSessions(User $user): array
    {
        $currentToken = $user->currentAccessToken();
        $currentTokenId = ($currentToken instanceof PersonalAccessToken) ? $currentToken->id : null;

        return $user->tokens()
            ->orderBy('last_active_at', 'desc')
            ->get()
            ->map(function ($token) use ($currentTokenId) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'ip_address' => $token->ip_address,
                    'device_type' => $token->device_type ?? 'unknown',
                    'browser' => $token->browser ?? 'Unknown',
                    'platform' => $token->platform ?? 'Unknown',
                    'location' => $token->location,
                    'last_active_at' => $token->last_active_at?->toIso8601String(),
                    'created_at' => $token->created_at->toIso8601String(),
                    'is_current' => $token->id === $currentTokenId,
                    'is_expired' => $this->isSessionExpired($token),
                ];
            })
            ->toArray();
    }

    /**
     * Révoquer une session spécifique
     */
    public function revokeSession(User $user, int $tokenId): bool
    {
        $token = $user->tokens()->find($tokenId);
        
        if (!$token) {
            return false;
        }

        // Ne pas permettre de révoquer sa propre session actuelle via cette méthode
        $currentToken = $user->currentAccessToken();
        if (($currentToken instanceof PersonalAccessToken) && $currentToken->id === $tokenId) {
            return false;
        }

        $token->delete();
        return true;
    }

    /**
     * Révoquer toutes les autres sessions
     */
    public function revokeOtherSessions(User $user): int
    {
        $currentToken = $user->currentAccessToken();
        $currentTokenId = ($currentToken instanceof PersonalAccessToken) ? $currentToken->id : null;

        if (!$currentTokenId) {
            // En mode SPA cookie, on révoque tout (pas de token DB courant)
            return $user->tokens()->delete();
        }

        $count = $user->tokens()
            ->where('id', '!=', $currentTokenId)
            ->delete();

        return $count;
    }

    /**
     * Révoquer toutes les sessions (déconnexion globale)
     */
    public function revokeAllSessions(User $user): int
    {
        return $user->tokens()->delete();
    }

    /**
     * Nettoyer les sessions expirées
     */
    public function cleanupExpiredSessions(): int
    {
        $expirationTime = now()->subMinutes(self::IDLE_TIMEOUT_MINUTES);

        return PersonalAccessToken::where('last_active_at', '<', $expirationTime)
            ->delete();
    }

    /**
     * Obtenir l'IP du client
     */
    private function getClientIp(Request $request): string
    {
        // Liste des headers à vérifier (dans l'ordre de priorité)
        $headers = [
            'CF-Connecting-IP',     // Cloudflare
            'X-Forwarded-For',      // Proxy standard
            'X-Real-IP',            // Nginx
        ];

        foreach ($headers as $header) {
            $ip = $request->header($header);
            if ($ip) {
                // X-Forwarded-For peut contenir plusieurs IPs, prendre la première
                $ip = explode(',', $ip)[0];
                $ip = trim($ip);
                
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $request->ip() ?? 'unknown';
    }

    /**
     * Parser le User-Agent
     */
    private function parseUserAgent(string $userAgent): array
    {
        $result = [
            'device_type' => 'desktop',
            'browser' => 'Unknown',
            'platform' => 'Unknown',
        ];

        // Détection du type d'appareil
        if (preg_match('/Mobile|Android.*Mobile|iPhone|iPod/i', $userAgent)) {
            $result['device_type'] = 'mobile';
        } elseif (preg_match('/iPad|Android(?!.*Mobile)|Tablet/i', $userAgent)) {
            $result['device_type'] = 'tablet';
        }

        // Détection du navigateur
        if (preg_match('/Chrome\/[\d.]+/i', $userAgent) && !preg_match('/Edge|Edg/i', $userAgent)) {
            preg_match('/Chrome\/([\d.]+)/i', $userAgent, $matches);
            $result['browser'] = 'Chrome ' . ($matches[1] ?? '');
        } elseif (preg_match('/Firefox\/[\d.]+/i', $userAgent)) {
            preg_match('/Firefox\/([\d.]+)/i', $userAgent, $matches);
            $result['browser'] = 'Firefox ' . ($matches[1] ?? '');
        } elseif (preg_match('/Safari\/[\d.]+/i', $userAgent) && !preg_match('/Chrome|Chromium/i', $userAgent)) {
            preg_match('/Version\/([\d.]+)/i', $userAgent, $matches);
            $result['browser'] = 'Safari ' . ($matches[1] ?? '');
        } elseif (preg_match('/Edge|Edg\//i', $userAgent)) {
            preg_match('/Edg?\/([\d.]+)/i', $userAgent, $matches);
            $result['browser'] = 'Edge ' . ($matches[1] ?? '');
        } elseif (preg_match('/MSIE|Trident/i', $userAgent)) {
            $result['browser'] = 'Internet Explorer';
        } elseif (preg_match('/Opera|OPR\//i', $userAgent)) {
            $result['browser'] = 'Opera';
        }

        // Détection du système d'exploitation
        if (preg_match('/Windows NT ([\d.]+)/i', $userAgent, $matches)) {
            $versions = [
                '10.0' => 'Windows 10/11',
                '6.3' => 'Windows 8.1',
                '6.2' => 'Windows 8',
                '6.1' => 'Windows 7',
            ];
            $result['platform'] = $versions[$matches[1]] ?? 'Windows';
        } elseif (preg_match('/Mac OS X ([\d_]+)/i', $userAgent, $matches)) {
            $version = str_replace('_', '.', $matches[1]);
            $result['platform'] = 'macOS ' . $version;
        } elseif (preg_match('/iPhone OS ([\d_]+)/i', $userAgent, $matches)) {
            $version = str_replace('_', '.', $matches[1]);
            $result['platform'] = 'iOS ' . $version;
        } elseif (preg_match('/Android ([\d.]+)/i', $userAgent, $matches)) {
            $result['platform'] = 'Android ' . $matches[1];
        } elseif (preg_match('/Linux/i', $userAgent)) {
            $result['platform'] = 'Linux';
        }

        // Nettoyer les versions
        $result['browser'] = trim($result['browser']);
        $result['platform'] = trim($result['platform']);

        return $result;
    }

    /**
     * Obtenir les statistiques de sessions
     */
    public function getSessionStats(User $user): array
    {
        $sessions = $user->tokens()->get();
        
        return [
            'total_sessions' => $sessions->count(),
            'max_sessions' => self::MAX_SESSIONS_PER_USER,
            'idle_timeout_minutes' => self::IDLE_TIMEOUT_MINUTES,
            'expired_sessions' => $sessions->filter(fn($t) => $this->isSessionExpired($t))->count(),
        ];
    }
}
