<?php

namespace App\Policies;

use App\Models\CreditBancaire;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CreditBancairePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('credits.voir');
    }

    public function view(User $user, CreditBancaire $credit): bool
    {
        return $user->hasPermissionTo('credits.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('credits.creer');
    }

    public function update(User $user, CreditBancaire $credit): bool
    {
        return $user->hasPermissionTo('credits.modifier');
    }

    public function delete(User $user, CreditBancaire $credit): bool
    {
        return $user->hasPermissionTo('credits.supprimer');
    }

    public function rembourser(User $user, CreditBancaire $credit): bool
    {
        return $user->hasPermissionTo('credits.modifier');
    }
}
