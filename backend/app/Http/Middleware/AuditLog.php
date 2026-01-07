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
            $this->logAction($request, $response);
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
        $tableName = $this->extractTableName($routeName);

        Audit::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'table_name' => $tableName,
            'record_id' => $request->route('id') ?? $this->extractIdFromResponse($response),
            'old_values' => null,
            'new_values' => $request->except(['password', 'password_confirmation', 'current_password']),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "{$action} sur {$tableName}",
        ]);
    }

    protected function extractTableName(string $routeName): string
    {
        $parts = explode('.', $routeName);
        return $parts[0] ?? 'unknown';
    }

    protected function extractIdFromResponse(Response $response): ?int
    {
        $content = json_decode($response->getContent(), true);
        return $content['id'] ?? $content['data']['id'] ?? null;
    }
}
