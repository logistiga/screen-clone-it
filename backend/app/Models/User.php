<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'nom',
        'email',
        'password',
        'telephone',
        'photo',
        'actif',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'actif' => 'boolean',
            'derniere_connexion' => 'datetime',
        ];
    }

    // Relations
    public function audits()
    {
        return $this->hasMany(Audit::class);
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    // Méthodes
    public function updateDerniereConnexion()
    {
        $this->derniere_connexion = now();
        $this->save();
    }
}
