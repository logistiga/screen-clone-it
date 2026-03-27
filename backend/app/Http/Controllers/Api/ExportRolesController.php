<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Export des rôles et permissions
 */
class ExportRolesController extends Controller
{
    public function roles(Request $request)
    {
        $format = $request->get('format', 'pdf');
        $search = $request->get('search');
        $hasUsers = $request->has('has_users') ? filter_var($request->get('has_users'), FILTER_VALIDATE_BOOLEAN) : null;
        $isSystem = $request->has('is_system') ? filter_var($request->get('is_system'), FILTER_VALIDATE_BOOLEAN) : null;

        $rolesQuery = Role::with('permissions');
        if ($search) {
            $rolesQuery->where('name', 'like', "%{$search}%");
        }

        $roles = $rolesQuery->get()->map(function ($role) {
            $usersCount = User::role($role->name)->count();
            $users = User::role($role->name)->select('id', 'name', 'email', 'actif')->get();
            
            return [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $this->getRoleDescription($role->name),
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'permissions_count' => $role->permissions->count(),
                'users_count' => $usersCount,
                'users' => $users,
                'is_system' => in_array($role->name, ['administrateur', 'directeur']),
                'created_at' => $role->created_at,
            ];
        });

        if ($hasUsers !== null) {
            $roles = $roles->filter(fn($r) => $hasUsers ? $r['users_count'] > 0 : $r['users_count'] === 0);
        }
        if ($isSystem !== null) {
            $roles = $roles->filter(fn($r) => $r['is_system'] === $isSystem);
        }
        $roles = $roles->values();

        $permissionsByModule = Permission::all()
            ->groupBy(fn($permission) => explode('.', $permission->name)[0] ?? 'autre')
            ->map(function ($permissions, $module) {
                return [
                    'module' => $module,
                    'label' => $this->getModuleLabel($module),
                    'permissions' => $permissions->map(function ($p) {
                        $parts = explode('.', $p->name);
                        return ['name' => $p->name, 'action' => $parts[1] ?? $p->name, 'label' => $this->getPermissionLabel($parts[1] ?? $p->name)];
                    })->values()->toArray(),
                ];
            })->values();

        $stats = [
            'total_roles' => $roles->count(),
            'total_permissions' => Permission::count(),
            'total_users' => User::count(),
            'system_roles' => $roles->filter(fn($r) => $r['is_system'])->count(),
            'custom_roles' => $roles->filter(fn($r) => !$r['is_system'])->count(),
        ];

        $data = [
            'roles' => $roles,
            'permissions_by_module' => $permissionsByModule,
            'stats' => $stats,
            'generated_at' => now()->format('d/m/Y H:i'),
            'generated_by' => auth()->user()->name ?? 'Système',
        ];

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('pdf.roles-permissions', $data);
            $pdf->setPaper('A4', 'landscape');
            return $pdf->download('roles-permissions-' . now()->format('Y-m-d') . '.pdf');
        }

        return $this->streamCSV($this->generateRolesCSV($roles, $permissionsByModule, $stats), 'roles-permissions');
    }

    protected function generateRolesCSV($roles, $permissionsByModule, $stats): string
    {
        $lines = [];
        $lines[] = "RAPPORT DES RÔLES ET PERMISSIONS";
        $lines[] = "Généré le: " . now()->format('d/m/Y H:i');
        $lines[] = "";
        $lines[] = "=== STATISTIQUES ===";
        $lines[] = "Total rôles;" . $stats['total_roles'];
        $lines[] = "Total permissions;" . $stats['total_permissions'];
        $lines[] = "Total utilisateurs;" . $stats['total_users'];
        $lines[] = "Rôles système;" . $stats['system_roles'];
        $lines[] = "Rôles personnalisés;" . $stats['custom_roles'];
        $lines[] = "";
        $lines[] = "=== LISTE DES RÔLES ===";
        $lines[] = "Nom;Description;Type;Permissions;Utilisateurs;Date création";
        
        foreach ($roles as $role) {
            $lines[] = implode(';', [
                ucfirst($role['name']), $role['description'],
                $role['is_system'] ? 'Système' : 'Personnalisé',
                $role['permissions_count'], $role['users_count'],
                $role['created_at'] ? date('d/m/Y', strtotime($role['created_at'])) : '-',
            ]);
        }
        $lines[] = "";
        $lines[] = "=== DÉTAIL DES PERMISSIONS PAR RÔLE ===";
        
        foreach ($roles as $role) {
            $lines[] = "";
            $lines[] = "--- " . strtoupper($role['name']) . " ---";
            $lines[] = "Description: " . $role['description'];
            $lines[] = "Nombre de permissions: " . $role['permissions_count'];
            $lines[] = "Nombre d'utilisateurs: " . $role['users_count'];
            $lines[] = "";
            
            $rolePermissions = collect($role['permissions']);
            foreach ($permissionsByModule as $module) {
                $modulePerms = $rolePermissions->filter(fn($p) => str_starts_with($p, $module['module'] . '.'));
                if ($modulePerms->count() > 0) {
                    $lines[] = $module['label'] . ": " . $modulePerms->map(fn($p) => explode('.', $p)[1] ?? $p)->implode(', ');
                }
            }
            
            if (count($role['users']) > 0) {
                $lines[] = "";
                $lines[] = "Utilisateurs:";
                foreach ($role['users'] as $user) {
                    $status = $user['actif'] ? 'Actif' : 'Inactif';
                    $lines[] = "  - " . $user['name'] . " (" . $user['email'] . ") - " . $status;
                }
            }
        }
        $lines[] = "";
        $lines[] = "=== PERMISSIONS PAR MODULE ===";
        foreach ($permissionsByModule as $module) {
            $lines[] = "";
            $lines[] = $module['label'] . " (" . count($module['permissions']) . " permissions):";
            foreach ($module['permissions'] as $perm) {
                $lines[] = "  - " . $perm['label'] . " (" . $perm['name'] . ")";
            }
        }
        
        return implode("\n", $lines);
    }

    protected function getRoleDescription(string $name): string
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

    protected function getModuleLabel(string $module): string
    {
        $labels = [
            'clients' => 'Clients', 'devis' => 'Devis', 'ordres' => 'Ordres de Travail',
            'factures' => 'Factures', 'paiements' => 'Paiements', 'caisse' => 'Caisse',
            'banques' => 'Banques', 'credits' => 'Crédits Bancaires', 'partenaires' => 'Partenaires',
            'notes' => 'Notes de Débit', 'utilisateurs' => 'Utilisateurs',
            'configuration' => 'Configuration', 'reporting' => 'Reporting', 'audit' => 'Traçabilité',
        ];
        return $labels[$module] ?? ucfirst($module);
    }

    protected function getPermissionLabel(string $action): string
    {
        $labels = ['voir' => 'Voir', 'creer' => 'Créer', 'modifier' => 'Modifier', 'supprimer' => 'Supprimer'];
        return $labels[$action] ?? ucfirst($action);
    }

    protected function streamCSV(string $content, string $filename): StreamedResponse
    {
        $date = now()->format('Y-m-d');
        return new StreamedResponse(function () use ($content) {
            echo "\xEF\xBB\xBF";
            echo $content;
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}_{$date}.csv\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
