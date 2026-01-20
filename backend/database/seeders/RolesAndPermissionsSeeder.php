<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Clear cached permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Load config
        $config = config('permissions');
        
        $modules = $config['modules'];
        $globalActions = $config['global_actions'];
        $specificActions = $config['specific_actions'];
        $predefinedRoles = $config['predefined_roles'];
        
        $allPermissions = [];
        
        // Create all permissions from modules config
        foreach ($modules as $moduleKey => $module) {
            // Global actions for this module
            foreach ($module['global_actions'] as $actionKey) {
                $permName = "{$moduleKey}.{$actionKey}";
                Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
                $allPermissions[] = $permName;
            }
            
            // Specific actions for this module
            foreach ($module['specific_actions'] as $actionKey) {
                $permName = "{$moduleKey}.{$actionKey}";
                Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
                $allPermissions[] = $permName;
            }
        }
        
        $this->command->info('Created ' . count($allPermissions) . ' permissions from config.');
        
        // Create predefined roles
        foreach ($predefinedRoles as $roleName => $roleConfig) {
            $role = Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web'],
                ['description' => $roleConfig['description'] ?? null]
            );
            
            // Update description if role already exists
            if ($role->description !== ($roleConfig['description'] ?? null)) {
                $role->description = $roleConfig['description'] ?? null;
                $role->save();
            }
            
            // Assign permissions
            if ($roleConfig['permissions'] === 'all') {
                $role->syncPermissions(Permission::all());
                $this->command->info("Role '{$roleName}' created with ALL permissions.");
            } else {
                // Filter only valid permissions
                $validPerms = array_filter($roleConfig['permissions'], function($perm) use ($allPermissions) {
                    return in_array($perm, $allPermissions);
                });
                $role->syncPermissions($validPerms);
                $this->command->info("Role '{$roleName}' created with " . count($validPerms) . " permissions.");
            }
        }
        
        // Clear cache again
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        
        $this->command->info('Roles and permissions seeding completed!');
    }
}
