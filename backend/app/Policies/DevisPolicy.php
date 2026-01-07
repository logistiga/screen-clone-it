<?php

namespace App\Policies;

use App\Models\Devis;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class DevisPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('devis.voir');
    }

    public function view(User $user, Devis $devis): bool
    {
        return $user->hasPermissionTo('devis.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('devis.creer');
    }

    public function update(User $user, Devis $devis): bool
    {
        return $user->hasPermissionTo('devis.modifier');
    }

    public function delete(User $user, Devis $devis): bool
    {
        return $user->hasPermissionTo('devis.supprimer');
    }

    public function convert(User $user, Devis $devis): bool
    {
        return $user->hasPermissionTo('ordres.creer');
    }
}
