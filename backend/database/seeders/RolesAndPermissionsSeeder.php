<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $modules = [
            'clients', 'devis', 'ordres', 'factures', 'paiements', 
            'caisse', 'banques', 'credits', 'partenaires', 'notes',
            'utilisateurs', 'configuration', 'reporting', 'audit'
        ];
        $actions = ['voir', 'creer', 'modifier', 'supprimer'];

        foreach ($modules as $module) {
            foreach ($actions as $action) {
                Permission::create(['name' => "{$module}.{$action}"]);
            }
        }

        // Rôle Administrateur
        $admin = Role::create(['name' => 'administrateur']);
        $admin->givePermissionTo(Permission::all());

        // Rôle Directeur (tous les droits comme admin)
        $directeur = Role::create(['name' => 'directeur']);
        $directeur->givePermissionTo(Permission::all());

        // Rôle Comptable
        $comptable = Role::create(['name' => 'comptable']);
        $comptable->givePermissionTo([
            'clients.voir', 'devis.voir', 'ordres.voir',
            'factures.voir', 'factures.creer', 'factures.modifier',
            'paiements.voir', 'paiements.creer',
            'caisse.voir', 'caisse.creer',
            'banques.voir',
            'credits.voir', 'credits.creer',
            'reporting.voir',
        ]);

        // Rôle Caissier
        $caissier = Role::create(['name' => 'caissier']);
        $caissier->givePermissionTo([
            'clients.voir',
            'paiements.voir', 'paiements.creer',
            'caisse.voir', 'caisse.creer',
            'banques.voir',
        ]);

        // Rôle Commercial
        $commercial = Role::create(['name' => 'commercial']);
        $commercial->givePermissionTo([
            'clients.voir', 'clients.creer', 'clients.modifier',
            'devis.voir', 'devis.creer', 'devis.modifier',
            'ordres.voir', 'ordres.creer',
            'factures.voir',
            'partenaires.voir',
        ]);

        // Rôle Opérateur
        $operateur = Role::create(['name' => 'operateur']);
        $operateur->givePermissionTo([
            'clients.voir',
            'ordres.voir', 'ordres.modifier',
            'factures.voir',
        ]);
    }
}
