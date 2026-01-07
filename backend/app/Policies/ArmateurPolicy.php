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
        return $user->hasPermissionTo('partenaires.voir');
    }

    public function view(User $user, Armateur $armateur): bool
    {
        return $user->hasPermissionTo('partenaires.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('partenaires.creer');
    }

    public function update(User $user, Armateur $armateur): bool
    {
        return $user->hasPermissionTo('partenaires.modifier');
    }

    public function delete(User $user, Armateur $armateur): bool
    {
        return $user->hasPermissionTo('partenaires.supprimer');
    }
}
