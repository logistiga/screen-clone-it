<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Policy pour les exports de données
 * CRITIQUE: Contrôle strict sur qui peut exporter quoi
 */
class ExportPolicy
{
    use HandlesAuthorization;

    /**
     * Vérifie si l'utilisateur peut exporter des données
     */
    public function export(User $user): bool
    {
        return $user->hasPermissionTo('reporting.voir');
    }

    /**
     * Export des factures
     */
    public function exportFactures(User $user): bool
    {
        return $user->hasPermissionTo('factures.voir') && 
               $user->hasPermissionTo('reporting.voir');
    }

    /**
     * Export des devis
     */
    public function exportDevis(User $user): bool
    {
        return $user->hasPermissionTo('devis.voir') && 
               $user->hasPermissionTo('reporting.voir');
    }

    /**
     * Export des ordres de travail
     */
    public function exportOrdres(User $user): bool
    {
        return $user->hasPermissionTo('ordres.voir') && 
               $user->hasPermissionTo('reporting.voir');
    }

    /**
     * Export des paiements
     */
    public function exportPaiements(User $user): bool
    {
        return $user->hasPermissionTo('paiements.voir') && 
               $user->hasPermissionTo('reporting.voir');
    }

    /**
     * Export de la caisse
     */
    public function exportCaisse(User $user): bool
    {
        return $user->hasPermissionTo('caisse.voir') && 
               $user->hasPermissionTo('reporting.voir');
    }

    /**
     * Export des clients - données sensibles
     */
    public function exportClients(User $user): bool
    {
        return $user->hasPermissionTo('clients.voir') && 
               $user->hasPermissionTo('reporting.voir');
    }

    /**
     * Export des rôles et permissions - TRÈS SENSIBLE
     */
    public function exportRoles(User $user): bool
    {
        return $user->hasRole('administrateur');
    }

    /**
     * Export du tableau de bord complet - TRÈS SENSIBLE
     */
    public function exportTableauDeBord(User $user): bool
    {
        return $user->hasPermissionTo('reporting.voir') && 
               $user->hasAnyRole(['administrateur', 'directeur', 'comptable']);
    }

    /**
     * Export des données financières (trésorerie, créances)
     */
    public function exportFinancier(User $user): bool
    {
        return $user->hasPermissionTo('reporting.voir') && 
               $user->hasAnyRole(['administrateur', 'directeur', 'comptable']);
    }
}
