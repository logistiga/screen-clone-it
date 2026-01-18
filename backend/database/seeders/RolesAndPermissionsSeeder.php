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

        // Modules complets de l'application
        $modules = [
            // Commercial
            'clients', 'devis', 'ordres', 'factures', 'partenaires',
            'transitaires', 'transporteurs', 'fournisseurs',
            // Finance
            'paiements', 'caisse', 'banques', 'credits', 'notes',
            // Stock & Produits
            'produits', 'stocks',
            // Administration
            'utilisateurs', 'roles', 'configuration', 
            // Rapports & Sécurité
            'reporting', 'audit', 'securite', 'dashboard', 'exports'
        ];
        
        // Actions standards
        $actions = ['voir', 'creer', 'modifier', 'supprimer'];
        
        // Créer permissions standard
        foreach ($modules as $module) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$module}.{$action}"]);
            }
        }
        
        // Actions supplémentaires par module
        $extraActions = [
            'devis' => ['valider', 'annuler', 'dupliquer', 'exporter', 'imprimer'],
            'ordres' => ['valider', 'annuler', 'assigner', 'exporter', 'imprimer'],
            'factures' => ['valider', 'annuler', 'exporter', 'imprimer', 'envoyer'],
            'paiements' => ['valider', 'annuler', 'exporter'],
            'caisse' => ['valider', 'annuler', 'exporter', 'cloture'],
            'clients' => ['exporter', 'importer', 'fusionner'],
            'utilisateurs' => ['activer', 'desactiver', 'assigner_role'],
            'roles' => ['assigner'],
            'reporting' => ['exporter'],
            'audit' => ['exporter'],
            'dashboard' => ['exporter'],
            'stocks' => ['entree', 'sortie', 'inventaire', 'exporter'],
        ];
        
        foreach ($extraActions as $module => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$module}.{$action}"]);
            }
        }

        foreach ($modules as $module) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$module}.{$action}"]);
            }
        }

        // Rôle Administrateur
        $admin = Role::firstOrCreate(['name' => 'administrateur']);
        $admin->syncPermissions(Permission::all());

        // Rôle Directeur (tous les droits comme admin)
        $directeur = Role::firstOrCreate(['name' => 'directeur']);
        $directeur->syncPermissions(Permission::all());

        // Rôle Comptable
        $comptable = Role::firstOrCreate(['name' => 'comptable']);
        $comptable->syncPermissions([
            'clients.voir', 'devis.voir', 'ordres.voir',
            'factures.voir', 'factures.creer', 'factures.modifier',
            'paiements.voir', 'paiements.creer',
            'caisse.voir', 'caisse.creer',
            'banques.voir',
            'credits.voir', 'credits.creer',
            'reporting.voir',
        ]);

        // Rôle Caissier
        $caissier = Role::firstOrCreate(['name' => 'caissier']);
        $caissier->syncPermissions([
            'clients.voir',
            'paiements.voir', 'paiements.creer',
            'caisse.voir', 'caisse.creer',
            'banques.voir',
        ]);

        // Rôle Commercial
        $commercial = Role::firstOrCreate(['name' => 'commercial']);
        $commercial->syncPermissions([
            'clients.voir', 'clients.creer', 'clients.modifier',
            'devis.voir', 'devis.creer', 'devis.modifier',
            'ordres.voir', 'ordres.creer',
            'factures.voir',
            'partenaires.voir',
        ]);

        // Rôle Opérateur
        $operateur = Role::firstOrCreate(['name' => 'operateur']);
        $operateur->syncPermissions([
            'clients.voir',
            'ordres.voir', 'ordres.modifier',
            'factures.voir',
        ]);
    }
}
