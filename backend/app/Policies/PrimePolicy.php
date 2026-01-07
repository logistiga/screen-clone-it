<?php

namespace App\Policies;

use App\Models\Prime;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PrimePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('partenaires.voir');
    }

    public function view(User $user, Prime $prime): bool
    {
        return $user->hasPermissionTo('partenaires.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('partenaires.creer');
    }

    public function update(User $user, Prime $prime): bool
    {
        return $user->hasPermissionTo('partenaires.modifier');
    }

    public function delete(User $user, Prime $prime): bool
    {
        return $user->hasPermissionTo('partenaires.supprimer');
    }

    public function payer(User $user, Prime $prime): bool
    {
        return $user->hasPermissionTo('caisse.creer');
    }
}
