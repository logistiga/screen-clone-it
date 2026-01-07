<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'actif' => $this->actif,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            
            // Roles et permissions
            'roles' => $this->whenLoaded('roles', fn() => 
                $this->roles->pluck('name')
            ),
            'permissions' => $this->whenLoaded('permissions', fn() => 
                $this->getAllPermissions()->pluck('name')
            ),
            
            // Role principal (pour simplifier côté front)
            'role' => $this->when($this->roles, fn() => 
                $this->roles->first()?->name
            ),
        ];
    }
}
