<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleController extends Controller
{
    /**
     * Liste des rôles avec leurs permissions
     */
    public function index(Request $request): JsonResponse
    {
        $query = Role::with('permissions');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query->get()->map(function ($role) {
            $usersCount = User::role($role->name)->count();
            return [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'description' => $this->getRoleDescription($role->name),
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'permissions_count' => $role->permissions->count(),
                'users_count' => $usersCount,
                'is_system' => in_array($role->name, ['administrateur', 'directeur']),
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ];
        });

        return response()->json([
            'data' => $roles,
            'total' => $roles->count(),
        ]);
    }

    /**
     * Statistiques globales des rôles
     */
    public function stats(): JsonResponse
    {
        $totalRoles = Role::count();
        $totalPermissions = Permission::count();
        $totalUsers = User::count();
        
        $rolesWithUsers = Role::all()->map(function ($role) {
            return [
                'name' => $role->name,
                'users_count' => User::role($role->name)->count(),
            ];
        })->sortByDesc('users_count')->values();

        $permissionsByModule = Permission::all()
            ->groupBy(function ($permission) {
                return explode('.', $permission->name)[0] ?? 'autre';
            })
            ->map(function ($permissions, $module) {
                return [
                    'module' => $module,
                    'count' => $permissions->count(),
                    'permissions' => $permissions->pluck('name')->toArray(),
                ];
            })
            ->values();

        return response()->json([
            'total_roles' => $totalRoles,
            'total_permissions' => $totalPermissions,
            'total_users' => $totalUsers,
            'roles_distribution' => $rolesWithUsers,
            'permissions_by_module' => $permissionsByModule,
        ]);
    }

    /**
     * Détail d'un rôle
     */
    public function show(Role $role): JsonResponse
    {
        $role->load('permissions');
        $users = User::role($role->name)->select('id', 'name', 'email', 'actif')->get();

        return response()->json([
            'id' => $role->id,
            'name' => $role->name,
            'guard_name' => $role->guard_name,
            'description' => $this->getRoleDescription($role->name),
            'permissions' => $role->permissions->pluck('name')->toArray(),
            'permissions_count' => $role->permissions->count(),
            'users' => $users,
            'users_count' => $users->count(),
            'is_system' => in_array($role->name, ['administrateur', 'directeur']),
            'created_at' => $role->created_at,
            'updated_at' => $role->updated_at,
        ]);
    }

    /**
     * Créer un nouveau rôle
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:500',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Rôle créé avec succès',
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'permissions_count' => $role->permissions->count(),
                'users_count' => 0,
                'is_system' => false,
            ],
        ], 201);
    }

    /**
     * Mettre à jour un rôle
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        // Empêcher la modification des rôles système
        if (in_array($role->name, ['administrateur', 'directeur'])) {
            return response()->json([
                'message' => 'Les rôles système ne peuvent pas être modifiés',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:roles,name,' . $role->id,
            'description' => 'nullable|string|max:500',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        if (isset($validated['name'])) {
            $role->update(['name' => $validated['name']]);
        }

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        $role->refresh();
        $role->load('permissions');

        return response()->json([
            'message' => 'Rôle mis à jour avec succès',
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'permissions_count' => $role->permissions->count(),
                'users_count' => User::role($role->name)->count(),
                'is_system' => false,
            ],
        ]);
    }

    /**
     * Supprimer un rôle
     */
    public function destroy(Role $role): JsonResponse
    {
        // Empêcher la suppression des rôles système
        if (in_array($role->name, ['administrateur', 'directeur'])) {
            return response()->json([
                'message' => 'Les rôles système ne peuvent pas être supprimés',
            ], 403);
        }

        // Vérifier si des utilisateurs ont ce rôle
        $usersCount = User::role($role->name)->count();
        if ($usersCount > 0) {
            return response()->json([
                'message' => "Ce rôle est assigné à {$usersCount} utilisateur(s). Veuillez d'abord réassigner ces utilisateurs.",
            ], 400);
        }

        $role->delete();

        return response()->json([
            'message' => 'Rôle supprimé avec succès',
        ]);
    }

    /**
     * Dupliquer un rôle
     */
    public function duplicate(Role $role): JsonResponse
    {
        $newName = $role->name . ' (copie)';
        $counter = 1;
        
        while (Role::where('name', $newName)->exists()) {
            $counter++;
            $newName = $role->name . " (copie {$counter})";
        }

        $newRole = Role::create([
            'name' => $newName,
            'guard_name' => 'web',
        ]);

        $newRole->syncPermissions($role->permissions);

        return response()->json([
            'message' => 'Rôle dupliqué avec succès',
            'role' => [
                'id' => $newRole->id,
                'name' => $newRole->name,
                'permissions' => $newRole->permissions->pluck('name')->toArray(),
                'permissions_count' => $newRole->permissions->count(),
                'users_count' => 0,
                'is_system' => false,
            ],
        ], 201);
    }

    /**
     * Liste de toutes les permissions disponibles
     */
    public function permissions(): JsonResponse
    {
        $permissions = Permission::all()
            ->groupBy(function ($permission) {
                return explode('.', $permission->name)[0] ?? 'autre';
            })
            ->map(function ($permissions, $module) {
                return [
                    'module' => $module,
                    'label' => $this->getModuleLabel($module),
                    'permissions' => $permissions->map(function ($p) {
                        $parts = explode('.', $p->name);
                        return [
                            'name' => $p->name,
                            'action' => $parts[1] ?? $p->name,
                            'label' => $this->getPermissionLabel($parts[1] ?? $p->name),
                        ];
                    })->values()->toArray(),
                ];
            })
            ->values();

        return response()->json([
            'data' => $permissions,
            'total' => Permission::count(),
        ]);
    }

    /**
     * Obtenir la description d'un rôle
     */
    private function getRoleDescription(string $name): string
    {
        $descriptions = [
            'administrateur' => 'Accès complet à toutes les fonctionnalités du système',
            'directeur' => 'Accès complet avec droits de supervision',
            'comptable' => 'Gestion des factures, paiements et finances',
            'caissier' => 'Gestion de la caisse et des encaissements',
            'commercial' => 'Gestion des clients, devis et prospection',
            'operateur' => 'Suivi des ordres de travail et opérations',
        ];

        return $descriptions[$name] ?? 'Rôle personnalisé';
    }

    /**
     * Obtenir le label d'un module
     */
    private function getModuleLabel(string $module): string
    {
        $labels = [
            'clients' => 'Clients',
            'devis' => 'Devis',
            'ordres' => 'Ordres de Travail',
            'factures' => 'Factures',
            'paiements' => 'Paiements',
            'caisse' => 'Caisse',
            'banques' => 'Banques',
            'credits' => 'Crédits Bancaires',
            'partenaires' => 'Partenaires',
            'notes' => 'Notes de Débit',
            'utilisateurs' => 'Utilisateurs',
            'configuration' => 'Configuration',
            'reporting' => 'Reporting',
            'audit' => 'Traçabilité',
        ];

        return $labels[$module] ?? ucfirst($module);
    }

    /**
     * Obtenir le label d'une action
     */
    private function getPermissionLabel(string $action): string
    {
        $labels = [
            'voir' => 'Voir',
            'creer' => 'Créer',
            'modifier' => 'Modifier',
            'supprimer' => 'Supprimer',
        ];

        return $labels[$action] ?? ucfirst($action);
    }
}
