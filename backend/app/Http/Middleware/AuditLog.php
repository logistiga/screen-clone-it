<?php

namespace App\Http\Middleware;

use App\Models\Audit;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLog
{
    protected array $excludedRoutes = [
        'api/login',
        'api/logout',
        'api/user',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->shouldLog($request, $response)) {
            // IMPORTANT: l'audit ne doit jamais casser la réponse API
            try {
                $this->logAction($request, $response);
            } catch (\Throwable $e) {
                // Ignorer toute erreur d'audit (table manquante, contraintes DB, etc.)
            }
        }

        return $response;
    }

    protected function shouldLog(Request $request, Response $response): bool
    {
        if (!$request->user()) {
            return false;
        }

        if (in_array($request->path(), $this->excludedRoutes)) {
            return false;
        }

        if ($request->isMethod('GET')) {
            return false;
        }

        return $response->isSuccessful();
    }

    protected function logAction(Request $request, Response $response): void
    {
        $action = match ($request->method()) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => $request->method(),
        };

        $routeName = $request->route()?->getName() ?? $request->path();
        $module = $this->extractTableName($routeName);

        Audit::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'module' => $module,
            'document_id' => $this->extractIdFromRoute($request) ?? $this->extractIdFromResponse($response),
            'details' => "{$action} sur {$module}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'old_values' => null,
            'new_values' => $request->except(['password', 'password_confirmation', 'current_password']),
        ]);
    }

    /**
     * Récupère un ID depuis les paramètres de route, quel que soit le nom du paramètre.
     * Supporte : {id}, {ordre}, {facture}, {devis}, etc. + binding modèle.
     */
    protected function extractIdFromRoute(Request $request): ?int
    {
        $route = $request->route();
        if (!$route) return null;

        foreach ($route->parameters() as $value) {
            // Paramètre simple (ex: /.../240)
            if (is_scalar($value) && is_numeric($value)) {
                return (int) $value;
            }

            // Paramètre bound à un modèle Eloquent
            if (is_object($value) && method_exists($value, 'getKey')) {
                $key = $value->getKey();
                if (is_numeric($key)) {
                    return (int) $key;
                }
            }
        }

        return null;
    }

    protected function extractTableName(string $routeName): string
    {
        $parts = explode('.', $routeName);
        return $parts[0] ?? 'unknown';
    }

    protected function extractIdFromResponse(Response $response): ?int
    {
        $content = json_decode($response->getContent(), true);
        if (!is_array($content)) return null;

        return $content['id']
            ?? ($content['data']['id'] ?? null)
            ?? ($content['annulation']['id'] ?? null)
            ?? ($content['annulation']['data']['id'] ?? null)
            ?? null;
    }
}
