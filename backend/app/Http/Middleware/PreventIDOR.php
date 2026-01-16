<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de protection contre les attaques IDOR
 * (Insecure Direct Object Reference)
 * 
 * Vérifie que l'utilisateur a le droit d'accéder à la ressource demandée
 */
class PreventIDOR
{
    /**
     * Mapping route -> Policy ability
     */
    protected array $resourceAbilities = [
        'clients' => ['model' => \App\Models\Client::class, 'ability' => 'view'],
        'factures' => ['model' => \App\Models\Facture::class, 'ability' => 'view'],
        'devis' => ['model' => \App\Models\Devis::class, 'ability' => 'view'],
        'ordres-travail' => ['model' => \App\Models\OrdreTravail::class, 'ability' => 'view'],
        'paiements' => ['model' => \App\Models\Paiement::class, 'ability' => 'view'],
        'banques' => ['model' => \App\Models\Banque::class, 'ability' => 'view'],
        'caisse' => ['model' => \App\Models\MouvementCaisse::class, 'ability' => 'view'],
        'users' => ['model' => \App\Models\User::class, 'ability' => 'view'],
        'transitaires' => ['model' => \App\Models\Transitaire::class, 'ability' => 'view'],
        'representants' => ['model' => \App\Models\Representant::class, 'ability' => 'view'],
        'armateurs' => ['model' => \App\Models\Armateur::class, 'ability' => 'view'],
        'primes' => ['model' => \App\Models\Prime::class, 'ability' => 'view'],
        'credits-bancaires' => ['model' => \App\Models\CreditBancaire::class, 'ability' => 'view'],
    ];

    /**
     * Routes sensibles qui nécessitent des rôles spécifiques
     */
    protected array $sensitiveRoutes = [
        'api/roles' => ['administrateur'],
        'api/permissions' => ['administrateur'],
        'api/configuration' => ['administrateur', 'directeur'],
        'api/audit' => ['administrateur'],
        'api/users' => ['administrateur', 'directeur'],
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        // 1. Vérifier les routes sensibles
        if ($this->isSensitiveRoute($request) && !$this->canAccessSensitiveRoute($request, $user)) {
            $this->logUnauthorizedAccess($request, 'sensitive_route');
            return response()->json([
                'message' => 'Accès non autorisé à cette ressource',
                'error' => 'forbidden'
            ], 403);
        }

        // 2. Vérifier l'accès aux ressources via les Policies
        $resourceCheck = $this->checkResourceAccess($request, $user);
        if ($resourceCheck !== null && !$resourceCheck) {
            $this->logUnauthorizedAccess($request, 'resource_policy');
            return response()->json([
                'message' => 'Vous n\'êtes pas autorisé à accéder à cette ressource',
                'error' => 'forbidden'
            ], 403);
        }

        // 3. Vérifier la cohérence des IDs dans le body vs route
        if (!$this->validateRequestIntegrity($request)) {
            $this->logUnauthorizedAccess($request, 'id_tampering');
            return response()->json([
                'message' => 'Requête invalide',
                'error' => 'bad_request'
            ], 400);
        }

        return $next($request);
    }

    /**
     * Vérifie si c'est une route sensible
     */
    protected function isSensitiveRoute(Request $request): bool
    {
        $path = $request->path();
        
        foreach ($this->sensitiveRoutes as $route => $roles) {
            if (str_starts_with($path, $route)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Vérifie si l'utilisateur peut accéder à une route sensible
     */
    protected function canAccessSensitiveRoute(Request $request, $user): bool
    {
        $path = $request->path();
        
        foreach ($this->sensitiveRoutes as $route => $allowedRoles) {
            if (str_starts_with($path, $route)) {
                return $user->hasAnyRole($allowedRoles);
            }
        }

        return true;
    }

    /**
     * Vérifie l'accès à une ressource via les Policies Laravel
     */
    protected function checkResourceAccess(Request $request, $user): ?bool
    {
        $path = $request->path();
        
        // Extraire le type de ressource et l'ID
        foreach ($this->resourceAbilities as $resource => $config) {
            $pattern = "/api\/{$resource}\/(\d+)/";
            
            if (preg_match($pattern, $path, $matches)) {
                $resourceId = $matches[1];
                $modelClass = $config['model'];
                
                // Charger le modèle
                $model = $modelClass::find($resourceId);
                
                if (!$model) {
                    return null; // Laisse le controller gérer le 404
                }

                // Déterminer l'ability selon la méthode HTTP
                $ability = match ($request->method()) {
                    'GET' => 'view',
                    'PUT', 'PATCH' => 'update',
                    'DELETE' => 'delete',
                    default => $config['ability'],
                };

                return Gate::forUser($user)->allows($ability, $model);
            }
        }

        return null; // Pas de vérification spécifique nécessaire
    }

    /**
     * Vérifie l'intégrité de la requête (anti-tampering)
     */
    protected function validateRequestIntegrity(Request $request): bool
    {
        // Pour les PUT/PATCH, vérifier que l'ID dans le body correspond à l'ID de la route
        if (in_array($request->method(), ['PUT', 'PATCH'])) {
            $routeId = $request->route('id') ?? 
                       $request->route('client') ?? 
                       $request->route('facture') ?? 
                       $request->route('devis') ??
                       $request->route('ordreTravail') ??
                       $request->route('paiement') ??
                       $request->route('user');

            $bodyId = $request->input('id');

            // Si un ID est dans le body et qu'il ne correspond pas à la route
            if ($bodyId !== null && $routeId !== null) {
                $routeIdValue = is_object($routeId) ? $routeId->id : $routeId;
                if ((int) $bodyId !== (int) $routeIdValue) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Log les tentatives d'accès non autorisé
     */
    protected function logUnauthorizedAccess(Request $request, string $reason): void
    {
        Log::channel('security')->warning('IDOR attempt detected', [
            'reason' => $reason,
            'user_id' => $request->user()?->id,
            'user_email' => $request->user()?->email,
            'ip_address' => $request->ip(),
            'method' => $request->method(),
            'path' => $request->path(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
