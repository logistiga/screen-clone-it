<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ConfigurationPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('configuration.voir');
    }

    public function update(User $user): bool
    {
        return $user->hasPermissionTo('configuration.modifier');
    }
}
