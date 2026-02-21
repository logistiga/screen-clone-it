<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Armateur extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'code',
        'types_conteneurs',
        'email',
        'telephone',
        'adresse',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'types_conteneurs' => 'array',
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

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }
}
