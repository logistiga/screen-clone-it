<?php

namespace App\Policies;

use App\Models\Transitaire;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TransitairePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('partenaires.voir');
    }

    public function view(User $user, Transitaire $transitaire): bool
    {
        return $user->hasPermissionTo('partenaires.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('partenaires.creer');
    }

    public function update(User $user, Transitaire $transitaire): bool
    {
        return $user->hasPermissionTo('partenaires.modifier');
    }

    public function delete(User $user, Transitaire $transitaire): bool
    {
        return $user->hasPermissionTo('partenaires.supprimer');
    }
}
