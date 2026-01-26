<?php

namespace App\Http\Middleware;

use App\Models\SecurityLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de logging sécurité
 * Log les événements de sécurité critiques : auth, exports, modifications sensibles
 */
class SecurityAuditLog
{
    /**
     * Routes/actions à logger pour la sécurité
     */
    protected array $securityRoutes = [
        // Authentification
        'api/auth/login' => 'auth.login',
        'api/auth/logout' => 'auth.logout',
        'api/auth/forgot-password' => 'auth.password_reset_request',
        'api/auth/reset-password' => 'auth.password_reset',
        
        // Exports (données sensibles)
        'api/exports/*' => 'export.data',
        
        // Gestion utilisateurs et permissions
        'api/users' => 'user.management',
        'api/users/*' => 'user.management',
        'api/roles' => 'role.management',
        'api/roles/*' => 'role.management',
        'api/permissions/*' => 'permission.management',
        
        // Configuration système
        'api/configuration/*' => 'config.change',
        
        // Annulations (opérations critiques)
        'api/annulations/*' => 'document.annulation',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        
        $response = $next($request);
        
        $duration = round((microtime(true) - $startTime) * 1000, 2);

        // IMPORTANT: le logging ne doit JAMAIS casser une requête API.
        // (ex: fichier de log non inscriptible, table security_logs absente, etc.)
        try {
            if ($this->shouldLog($request)) {
                $this->logSecurityEvent($request, $response, $duration);
            }
        } catch (\Throwable $e) {
            Log::error('SecurityAuditLog middleware failed', [
                'error' => $e->getMessage(),
                'path' => $request->path(),
                'method' => $request->method(),
            ]);
        }

        return $response;
    }

    /**
     * Détermine si l'événement doit être loggé
     */
    protected function shouldLog(Request $request): bool
    {
        $path = $request->path();
        
        foreach ($this->securityRoutes as $pattern => $eventType) {
            if ($this->matchesPattern($path, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Log l'événement de sécurité
     */
    protected function logSecurityEvent(Request $request, Response $response, float $duration): void
    {
        $path = $request->path();
        $eventType = $this->getEventType($path);
        $user = $request->user();
        
        $logData = [
            'event_type' => $eventType,
            'user_id' => $user?->id,
            'user_email' => $user?->email ?? $request->input('email'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'method' => $request->method(),
            'path' => $path,
            'status_code' => $response->getStatusCode(),
            'duration_ms' => $duration,
            'timestamp' => now()->toIso8601String(),
        ];

        // Ajouter des infos contextuelles selon le type d'événement
        $logData['context'] = $this->getEventContext($request, $response, $eventType);

        // Log dans le fichier security.log
        // Peut échouer si storage/logs n'est pas inscriptible => on protège.
        try {
            Log::channel('security')->info($eventType, $logData);
        } catch (\Throwable $e) {
            Log::error('Failed to write security channel log', [
                'error' => $e->getMessage(),
                'event_type' => $eventType,
                'path' => $request->path(),
            ]);
        }

        // Également stocker en base pour les événements critiques
        if ($this->isCriticalEvent($eventType, $response)) {
            $this->storeSecurityLog($logData);
        }
    }

    /**
     * Obtenir le type d'événement basé sur le path
     */
    protected function getEventType(string $path): string
    {
        foreach ($this->securityRoutes as $pattern => $eventType) {
            if ($this->matchesPattern($path, $pattern)) {
                return $eventType;
            }
        }

        return 'unknown';
    }

    /**
     * Pattern matching avec support wildcard
     */
    protected function matchesPattern(string $path, string $pattern): bool
    {
        if ($path === $pattern) {
            return true;
        }

        // Support wildcard *
        if (str_contains($pattern, '*')) {
            $regex = '/^' . str_replace(['/', '*'], ['\/', '.*'], $pattern) . '$/';
            return (bool) preg_match($regex, $path);
        }

        return false;
    }

    /**
     * Contexte additionnel selon le type d'événement
     */
    protected function getEventContext(Request $request, Response $response, string $eventType): array
    {
        $context = [];

        switch ($eventType) {
            case 'auth.login':
                $context['success'] = $response->getStatusCode() === 200;
                $context['email_attempted'] = $request->input('email');
                break;

            case 'export.data':
                $context['export_type'] = $request->route('type') ?? basename($request->path());
                $context['format'] = $request->input('format', 'csv');
                $context['filters'] = $request->only(['date_debut', 'date_fin', 'client_id', 'statut']);
                break;

            case 'user.management':
            case 'role.management':
                $context['target_id'] = $request->route('id') ?? $request->route('user') ?? $request->route('role');
                $context['action'] = $request->method();
                break;

            case 'document.annulation':
                $context['document_type'] = $this->extractDocumentType($request->path());
                $context['document_id'] = $request->route('facture') ?? $request->route('ordre') ?? $request->route('devis');
                $context['motif'] = $request->input('motif');
                break;

            case 'config.change':
                $context['config_key'] = $request->input('key');
                break;
        }

        return $context;
    }

    /**
     * Événements critiques à stocker en base
     */
    protected function isCriticalEvent(string $eventType, Response $response): bool
    {
        $criticalEvents = [
            'auth.login',
            'auth.password_reset',
            'export.data',
            'user.management',
            'role.management',
            'permission.management',
            'document.annulation',
        ];

        // Login échoués sont critiques
        if ($eventType === 'auth.login' && $response->getStatusCode() !== 200) {
            return true;
        }

        return in_array($eventType, $criticalEvents);
    }

    /**
     * Stocke le log de sécurité en base
     */
    protected function storeSecurityLog(array $data): void
    {
        try {
            SecurityLog::create([
                'event_type' => $data['event_type'],
                'user_id' => $data['user_id'],
                'user_email' => $data['user_email'],
                'ip_address' => $data['ip_address'],
                'user_agent' => $data['user_agent'],
                'method' => $data['method'],
                'path' => $data['path'],
                'status_code' => $data['status_code'],
                'duration_ms' => $data['duration_ms'],
                'context' => $data['context'] ?? [],
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to store security log', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Extrait le type de document du path
     */
    protected function extractDocumentType(string $path): string
    {
        if (str_contains($path, 'facture')) return 'facture';
        if (str_contains($path, 'ordre')) return 'ordre';
        if (str_contains($path, 'devis')) return 'devis';
        return 'unknown';
    }
}
