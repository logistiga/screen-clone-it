<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExportService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;

class ExportController extends Controller
{
    protected ExportService $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    public function factures(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut', 'client_id']);
        $csv = $this->exportService->exportFacturesCSV($filters);
        
        return $this->streamCSV($csv, 'factures');
    }

    public function devis(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut']);
        $csv = $this->exportService->exportDevisCSV($filters);
        
        return $this->streamCSV($csv, 'devis');
    }

    public function ordres(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut', 'client_id', 'categorie']);
        $csv = $this->exportService->exportOrdresCSV($filters);
        
        return $this->streamCSV($csv, 'ordres-travail');
    }

    public function primes(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'statut', 'representant_id']);
        $csv = $this->exportService->exportPrimesCSV($filters);
        
        return $this->streamCSV($csv, 'primes');
    }

    public function activiteGlobale(Request $request): StreamedResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfYear()->toDateString());
        $dateFin = $request->get('date_fin', now()->endOfYear()->toDateString());
        $csv = $this->exportService->exportActiviteGlobaleCSV($dateDebut, $dateFin);
        
        return $this->streamCSV($csv, 'activite-globale');
    }

    public function paiements(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'mode_paiement']);
        $csv = $this->exportService->exportPaiementsCSV($filters);
        
        return $this->streamCSV($csv, 'paiements');
    }

    public function caisse(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'type', 'categorie']);
        $csv = $this->exportService->exportCaisseCSV($filters);
        
        return $this->streamCSV($csv, 'caisse');
    }

    /**
     * Export caisse espèces uniquement (pour la caisse journalière)
     */
    public function caisseEspeces(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'type']);
        $filters['source'] = 'caisse'; // Forcer source = caisse (espèces uniquement)
        $csv = $this->exportService->exportCaisseEspecesCSV($filters);
        
        return $this->streamCSV($csv, 'caisse-especes');
    }

    public function clients(Request $request): StreamedResponse
    {
        $filters = $request->only(['type', 'actif']);
        $csv = $this->exportService->exportClientsCSV($filters);
        
        return $this->streamCSV($csv, 'clients');
    }

    public function chiffreAffaires(Request $request): StreamedResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $csv = $this->exportService->exportChiffreAffairesCSV($annee);
        
        return $this->streamCSV($csv, "chiffre-affaires-{$annee}");
    }

    public function creances(Request $request): StreamedResponse
    {
        $csv = $this->exportService->exportCreancesCSV();
        
        return $this->streamCSV($csv, 'creances');
    }

    public function tresorerie(Request $request): StreamedResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth()->toDateString());
        $dateFin = $request->get('date_fin', now()->endOfMonth()->toDateString());
        $csv = $this->exportService->exportTresorerieCSV($dateDebut, $dateFin);
        
        return $this->streamCSV($csv, 'tresorerie');
    }

    public function credits(Request $request): StreamedResponse
    {
        $filters = $request->only(['statut', 'banque_id']);
        $csv = $this->exportService->exportCreditsCSV($filters);
        
        return $this->streamCSV($csv, 'credits');
    }

    public function annulations(Request $request): StreamedResponse
    {
        $filters = $request->only(['date_debut', 'date_fin', 'type']);
        $csv = $this->exportService->exportAnnulationsCSV($filters);
        
        return $this->streamCSV($csv, 'annulations');
    }

    public function tableauDeBord(Request $request): StreamedResponse
    {
        $annee = (int) $request->get('annee', date('Y'));
        $csv = $this->exportService->exportTableauDeBordCSV($annee);
        
        return $this->streamCSV($csv, "tableau-de-bord-{$annee}");
    }

    /**
     * Export complet de la caisse globale (PDF ou Excel)
     */
    public function caisseGlobale(Request $request)
    {
        $filters = [
            'date_debut' => $request->get('date_debut', now()->startOfMonth()->toDateString()),
            'date_fin' => $request->get('date_fin', now()->toDateString()),
            'type' => $request->get('type', 'all'),
            'source' => $request->get('source', 'all'),
            'banque_id' => $request->get('banque_id'),
            'include_details' => $request->get('include_details', '1') === '1',
            'include_summary' => $request->get('include_summary', '1') === '1',
        ];
        
        $format = $request->get('format', 'pdf');
        
        if ($format === 'pdf') {
            return $this->exportService->exportCaisseGlobalePDF($filters);
        }
        
        // Excel/CSV export
        $csv = $this->exportService->exportCaisseGlobaleCSV($filters);
        return $this->streamCSV($csv, 'caisse-globale');
    }

    /**
     * Export des rôles et permissions (PDF ou Excel)
     */
    public function roles(Request $request)
    {
        $format = $request->get('format', 'pdf');
        $search = $request->get('search');
        $hasUsers = $request->has('has_users') ? filter_var($request->get('has_users'), FILTER_VALIDATE_BOOLEAN) : null;
        $isSystem = $request->has('is_system') ? filter_var($request->get('is_system'), FILTER_VALIDATE_BOOLEAN) : null;

        // Récupérer les rôles
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

        // Appliquer les filtres
        if ($hasUsers !== null) {
            $roles = $roles->filter(fn($r) => $hasUsers ? $r['users_count'] > 0 : $r['users_count'] === 0);
        }
        
        if ($isSystem !== null) {
            $roles = $roles->filter(fn($r) => $r['is_system'] === $isSystem);
        }

        $roles = $roles->values();

        // Récupérer les permissions groupées par module
        $permissionsByModule = Permission::all()
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

        // Statistiques
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

        // Export CSV/Excel
        return $this->streamCSV($this->generateRolesCSV($roles, $permissionsByModule, $stats), 'roles-permissions');
    }

    /**
     * Génère le contenu CSV pour l'export des rôles
     */
    protected function generateRolesCSV($roles, $permissionsByModule, $stats): string
    {
        $lines = [];
        
        // En-tête du rapport
        $lines[] = "RAPPORT DES RÔLES ET PERMISSIONS";
        $lines[] = "Généré le: " . now()->format('d/m/Y H:i');
        $lines[] = "";
        
        // Statistiques
        $lines[] = "=== STATISTIQUES ===";
        $lines[] = "Total rôles;" . $stats['total_roles'];
        $lines[] = "Total permissions;" . $stats['total_permissions'];
        $lines[] = "Total utilisateurs;" . $stats['total_users'];
        $lines[] = "Rôles système;" . $stats['system_roles'];
        $lines[] = "Rôles personnalisés;" . $stats['custom_roles'];
        $lines[] = "";
        
        // Liste des rôles
        $lines[] = "=== LISTE DES RÔLES ===";
        $lines[] = "Nom;Description;Type;Permissions;Utilisateurs;Date création";
        
        foreach ($roles as $role) {
            $lines[] = implode(';', [
                ucfirst($role['name']),
                $role['description'],
                $role['is_system'] ? 'Système' : 'Personnalisé',
                $role['permissions_count'],
                $role['users_count'],
                $role['created_at'] ? date('d/m/Y', strtotime($role['created_at'])) : '-',
            ]);
        }
        
        $lines[] = "";
        
        // Détail des permissions par rôle
        $lines[] = "=== DÉTAIL DES PERMISSIONS PAR RÔLE ===";
        
        foreach ($roles as $role) {
            $lines[] = "";
            $lines[] = "--- " . strtoupper($role['name']) . " ---";
            $lines[] = "Description: " . $role['description'];
            $lines[] = "Nombre de permissions: " . $role['permissions_count'];
            $lines[] = "Nombre d'utilisateurs: " . $role['users_count'];
            $lines[] = "";
            
            // Permissions groupées par module
            $rolePermissions = collect($role['permissions']);
            foreach ($permissionsByModule as $module) {
                $modulePerms = $rolePermissions->filter(fn($p) => str_starts_with($p, $module['module'] . '.'));
                if ($modulePerms->count() > 0) {
                    $lines[] = $module['label'] . ": " . $modulePerms->map(fn($p) => explode('.', $p)[1] ?? $p)->implode(', ');
                }
            }
            
            // Utilisateurs du rôle
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
        
        // Permissions par module
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

    /**
     * Obtenir la description d'un rôle
     */
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

    /**
     * Obtenir le label d'un module
     */
    protected function getModuleLabel(string $module): string
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
    protected function getPermissionLabel(string $action): string
    {
        $labels = [
            'voir' => 'Voir',
            'creer' => 'Créer',
            'modifier' => 'Modifier',
            'supprimer' => 'Supprimer',
        ];

        return $labels[$action] ?? ucfirst($action);
    }

    /**
     * Génère une réponse CSV streamée
     */
    protected function streamCSV(string $content, string $filename): StreamedResponse
    {
        $date = now()->format('Y-m-d');
        
        return new StreamedResponse(function () use ($content) {
            echo "\xEF\xBB\xBF"; // BOM UTF-8 pour Excel
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
