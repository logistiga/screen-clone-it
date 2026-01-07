<?php

namespace App\Policies;

use App\Models\Paiement;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PaiementPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('paiements.voir');
    }

    public function view(User $user, Paiement $paiement): bool
    {
        return $user->hasPermissionTo('paiements.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('paiements.creer');
    }

    public function delete(User $user, Paiement $paiement): bool
    {
        return $user->hasPermissionTo('paiements.supprimer');
    }
}
