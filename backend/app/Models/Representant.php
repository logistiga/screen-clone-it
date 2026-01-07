<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Representant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'email',
        'telephone',
        'adresse',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    // Relations
    public function devis()
    {
        return $this->hasMany(Devis::class);
    }

    public function ordres()
    {
        return $this->hasMany(OrdreTravail::class);
    }

    public function factures()
    {
        return $this->hasMany(Facture::class);
    }

    public function primes()
    {
        return $this->hasMany(Prime::class);
    }

    public function paiementsPrimes()
    {
        return $this->hasMany(PaiementPrime::class);
    }

    // Accessors
    public function getTotalPrimesDuesAttribute()
    {
        return $this->primes()->where('statut', 'due')->sum('montant');
    }

    public function getTotalPrimesPayeesAttribute()
    {
        return $this->primes()->where('statut', 'payee')->sum('montant');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }
}
