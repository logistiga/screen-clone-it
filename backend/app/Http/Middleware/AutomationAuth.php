<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Accès machine n8n/Mora : clé X-Automation-Key, permission par route,
 * limitation de débit et journal. La clé n'est jamais journalisée.
 * Usage : ->middleware('automation:devis:creer')
 */
class AutomationAuth
{
    public function handle(Request $request, Closure $next, string ...$perm): Response
    {
        $start = microtime(true);
        $permission = implode(':', $perm);

        if (!config('automation.enabled')) {
            return $this->error('DISABLED', 'Automatisation désactivée.', 503);
        }

        $key = trim((string) $request->header('X-Automation-Key', ''));
        $client = $key === '' ? null : $this->match($key);
        if ($client === null) {
            return $this->error('UNAUTHENTICATED', 'Clé d\'automatisation invalide ou manquante.', 401);
        }

        if ($permission !== '' && !in_array($permission, $client['permissions'], true)) {
            return $this->error('FORBIDDEN', "Permission requise : {$permission}.", 403);
        }

        $rl = 'automation:' . $client['name'];
        if (RateLimiter::tooManyAttempts($rl, (int) config('automation.rate_limit_per_minute', 30))) {
            return $this->error('RATE_LIMITED', 'Trop de requêtes, réessayez dans une minute.', 429);
        }
        RateLimiter::hit($rl, 60);

        $request->attributes->set('automation_client', $client['name']);
        $response = $next($request);

        try {
            Log::channel(config('automation.log_channel', 'daily'))->info('automation_api', [
                'endpoint' => $request->method() . ' /' . $request->path(),
                'client' => $client['name'],
                'status' => $response->getStatusCode(),
                'idempotency_key' => $request->header('X-Idempotency-Key'),
                'duration_ms' => (int) round((microtime(true) - $start) * 1000),
                'ip' => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            // Le journal ne doit jamais casser la réponse.
        }

        return $response;
    }

    private function match(string $key): ?array
    {
        foreach ((array) config('automation.keys', []) as $c) {
            if (hash_equals((string) $c['key'], $key)) {
                return ['name' => $c['name'], 'permissions' => $c['permissions']];
            }
        }
        return null;
    }

    private function error(string $code, string $message, int $status): Response
    {
        return response()->json(['success' => false, 'error' => ['code' => $code, 'message' => $message]], $status);
    }
}
