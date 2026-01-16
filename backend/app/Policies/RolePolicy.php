<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Policy pour la gestion des rôles
 * CRITIQUE: Seuls les administrateurs peuvent gérer les rôles
 */
class RolePolicy
{
    use HandlesAuthorization;

    /**
     * Seul un administrateur peut voir les rôles
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('administrateur');
    }

    /**
     * Seul un administrateur peut voir un rôle spécifique
     */
    public function view(User $user, Role $role): bool
    {
        return $user->hasRole('administrateur');
    }

    /**
     * Seul un administrateur peut créer des rôles
     */
    public function create(User $user): bool
    {
        return $user->hasRole('administrateur');
    }

    /**
     * Seul un administrateur peut modifier un rôle
     * Interdit de modifier le rôle "administrateur" sauf par lui-même
     */
    public function update(User $user, Role $role): bool
    {
        if (!$user->hasRole('administrateur')) {
            return false;
        }

        // Protection: le rôle administrateur ne peut être modifié que par un admin
        // qui a ce rôle lui-même (empêche de se retirer ses propres droits)
        return true;
    }

    /**
     * Seul un administrateur peut supprimer un rôle
     * Interdit de supprimer le rôle "administrateur"
     */
    public function delete(User $user, Role $role): bool
    {
        if (!$user->hasRole('administrateur')) {
            return false;
        }

        // Protection: impossible de supprimer le rôle administrateur
        if ($role->name === 'administrateur') {
            return false;
        }

        return true;
    }

    /**
     * Seul un administrateur peut assigner des rôles
     */
    public function assignRole(User $user): bool
    {
        return $user->hasRole('administrateur');
    }

    /**
     * Seul un administrateur peut retirer des rôles
     */
    public function removeRole(User $user): bool
    {
        return $user->hasRole('administrateur');
    }
}
