<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Audit;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Policy pour l'audit trail
 * CRITIQUE: L'audit est en lecture seule et réservé aux admins
 */
class AuditPolicy
{
    use HandlesAuthorization;

    /**
     * Seuls les administrateurs peuvent voir l'audit
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('administrateur') || 
               $user->hasPermissionTo('audit.voir');
    }

    /**
     * Voir un enregistrement d'audit spécifique
     */
    public function view(User $user, Audit $audit): bool
    {
        // Un utilisateur peut voir ses propres actions
        if ($audit->user_id === $user->id) {
            return true;
        }

        return $user->hasRole('administrateur') || 
               $user->hasPermissionTo('audit.voir');
    }

    /**
     * Personne ne peut créer manuellement des audits
     * (création automatique par le système)
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Personne ne peut modifier l'audit
     */
    public function update(User $user, Audit $audit): bool
    {
        return false;
    }

    /**
     * Seul un super admin peut supprimer l'audit (pour purge)
     */
    public function delete(User $user, Audit $audit): bool
    {
        return $user->hasRole('administrateur') && 
               $user->hasPermissionTo('audit.supprimer');
    }

    /**
     * Export de l'audit - très sensible
     */
    public function export(User $user): bool
    {
        return $user->hasRole('administrateur');
    }
}
