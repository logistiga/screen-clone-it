<?php

namespace App\Policies;

use App\Models\Armateur;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ArmateurPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('armateurs.voir');
    }

    public function view(User $user, Armateur $armateur): bool
    {
        return $user->hasPermissionTo('armateurs.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('armateurs.creer');
    }

    public function update(User $user, Armateur $armateur): bool
    {
        return $user->hasPermissionTo('armateurs.modifier');
    }

    public function delete(User $user, Armateur $armateur): bool
    {
        return $user->hasPermissionTo('armateurs.supprimer');
    }
}
