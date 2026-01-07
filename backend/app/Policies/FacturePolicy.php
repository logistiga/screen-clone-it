<?php

namespace App\Policies;

use App\Models\Facture;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FacturePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('factures.voir');
    }

    public function view(User $user, Facture $facture): bool
    {
        return $user->hasPermissionTo('factures.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('factures.creer');
    }

    public function update(User $user, Facture $facture): bool
    {
        return $user->hasPermissionTo('factures.modifier');
    }

    public function delete(User $user, Facture $facture): bool
    {
        return $user->hasPermissionTo('factures.supprimer');
    }

    public function annuler(User $user, Facture $facture): bool
    {
        return $user->hasPermissionTo('factures.modifier');
    }
}
