<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('utilisateurs.voir');
    }

    public function view(User $user, User $model): bool
    {
        return $user->hasPermissionTo('utilisateurs.voir') || $user->id === $model->id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('utilisateurs.creer');
    }

    public function update(User $user, User $model): bool
    {
        return $user->hasPermissionTo('utilisateurs.modifier') || $user->id === $model->id;
    }

    public function delete(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return false;
        }
        return $user->hasPermissionTo('utilisateurs.supprimer');
    }

    public function manageRoles(User $user): bool
    {
        return $user->hasRole('administrateur');
    }
}
