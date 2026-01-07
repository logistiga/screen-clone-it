<?php

namespace App\Policies;

use App\Models\OrdreTravail;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrdreTravailPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('ordres.voir');
    }

    public function view(User $user, OrdreTravail $ordre): bool
    {
        return $user->hasPermissionTo('ordres.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('ordres.creer');
    }

    public function update(User $user, OrdreTravail $ordre): bool
    {
        return $user->hasPermissionTo('ordres.modifier');
    }

    public function delete(User $user, OrdreTravail $ordre): bool
    {
        return $user->hasPermissionTo('ordres.supprimer');
    }

    public function convert(User $user, OrdreTravail $ordre): bool
    {
        return $user->hasPermissionTo('factures.creer');
    }
}
