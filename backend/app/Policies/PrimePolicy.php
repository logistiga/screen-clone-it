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
        return $user->hasPermissionTo('primes.voir');
    }

    public function view(User $user, Prime $prime): bool
    {
        return $user->hasPermissionTo('primes.voir');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('primes.creer');
    }

    public function update(User $user, Prime $prime): bool
    {
        return $user->hasPermissionTo('primes.modifier');
    }

    public function delete(User $user, Prime $prime): bool
    {
        return $user->hasPermissionTo('primes.supprimer');
    }

    public function payer(User $user, Prime $prime): bool
    {
        return $user->hasPermissionTo('caisse.creer');
    }
}
