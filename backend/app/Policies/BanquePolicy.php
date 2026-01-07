<?php

namespace App\Policies;

use App\Models\Banque;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BanquePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('banques.voir');
    }

    public function view(User $user, Banque $banque): bool
    {
        return $user->hasPermissionTo('banques.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('banques.creer');
    }

    public function update(User $user, Banque $banque): bool
    {
        return $user->hasPermissionTo('banques.modifier');
    }

    public function delete(User $user, Banque $banque): bool
    {
        return $user->hasPermissionTo('banques.supprimer');
    }
}
