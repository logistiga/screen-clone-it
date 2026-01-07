<?php

namespace App\Policies;

use App\Models\MouvementCaisse;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CaissePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('caisse.voir');
    }

    public function view(User $user, MouvementCaisse $mouvement): bool
    {
        return $user->hasPermissionTo('caisse.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('caisse.creer');
    }

    public function delete(User $user, MouvementCaisse $mouvement): bool
    {
        return $user->hasPermissionTo('caisse.supprimer');
    }
}
