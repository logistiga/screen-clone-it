<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authentification + lecture seule + limitation de débit + journal
 * pour l'intégration ChatGPT. Le token n'est jamais journalisé.
 */
class ChatGptAuth
{
    /** Seules routes POST autorisées (requêtes de lecture structurées). */
    private const READ_POST_PATHS = ['api/gpt/query'];

    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        if (!config('chatgpt.enabled')) {
            return $this->error('DISABLED', 'Intégration ChatGPT désactivée.', 503);
        }

        $token = $this->extractToken($request);
        if ($token === '') {
            return $this->error('UNAUTHENTICATED', 'Token manquant.', 401);
        }

        $tokenId = $this->matchToken($token);
        if ($tokenId === null) {
            return $this->error('UNAUTHENTICATED', 'Token invalide.', 401);
        }

        if (!$this->isReadOnly($request)) {
            return $this->error('READ_ONLY', 'Cette intégration est en lecture seule.', 405);
        }

        $key = 'chatgpt:' . $tokenId;
        $max = (int) config('chatgpt.rate_limit_per_minute', 60);
        if (RateLimiter::tooManyAttempts($key, $max)) {
            return $this->error('RATE_LIMITED', 'Trop de requêtes, réessayez dans une minute.', 429);
        }
        RateLimiter::hit($key, 60);

        $request->attributes->set('chatgpt_token_id', $tokenId);
        $response = $next($request);

        $this->audit($request, $response, $tokenId, $start);

        return $response;
    }

    /** Certains hébergeurs Apache retirent le header Authorization : on lit aussi les variantes serveur. */
    private function extractToken(Request $request): string
    {
        $token = (string) $request->bearerToken();
        if ($token !== '') {
            return $token;
        }
        foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $key) {
            $h = (string) $request->server($key, '');
            if (stripos($h, 'Bearer ') === 0) {
                return trim(substr($h, 7));
            }
        }
        return trim((string) $request->header('X-Api-Key', ''));
    }

    /** Renvoie un identifiant non sensible (empreinte courte) du token reconnu. */
    private function matchToken(string $token): ?string
    {
        foreach ((array) config('chatgpt.tokens', []) as $valid) {
            if ($valid !== '' && hash_equals($valid, $token)) {
                return substr(hash('sha256', $valid), 0, 12);
            }
        }
        return null;
    }

    private function isReadOnly(Request $request): bool
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return true;
        }
        return $request->isMethod('POST') && in_array(ltrim($request->path(), '/'), self::READ_POST_PATHS, true);
    }

    private function audit(Request $request, Response $response, string $tokenId, float $start): void
    {
        try {
            $content = (string) $response->getContent();
            $decoded = json_decode($content, true);
            $count = is_array($decoded['data'] ?? null) ? count($decoded['data']) : null;

            Log::channel(config('chatgpt.log_channel', 'daily'))->info('chatgpt_api', [
                'endpoint' => $request->method() . ' /' . $request->path(),
                'integration' => $tokenId,
                'resource' => $request->input('resource') ?? $request->route('resource'),
                'status' => $response->getStatusCode(),
                'duration_ms' => (int) round((microtime(true) - $start) * 1000),
                'results' => $count,
                'ip' => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            // Le journal ne doit jamais casser une réponse.
        }
    }

    private function error(string $code, string $message, int $status): Response
    {
        return response()->json([
            'success' => false,
            'error' => ['code' => $code, 'message' => $message],
        ], $status);
    }
}
