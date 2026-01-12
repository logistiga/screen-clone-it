<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prime extends Model
{
    use HasFactory;

    protected $fillable = [
        'ordre_id',
        'facture_id',
        'transitaire_id',
        'representant_id',
        'montant',
        'description',
        'statut',
        'date_paiement',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'date',
    ];

    // Relations
    public function paiements()
    {
        return $this->hasMany(\App\Models\PaiementPrime::class, 'prime_id');
    }

    // Relations
    public function ordre()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
    }

    public function transitaire()
    {
        return $this->belongsTo(Transitaire::class);
    }

    public function representant()
    {
        return $this->belongsTo(Representant::class);
    }

    // Scopes
    public function scopeDues($query)
    {
        return $query->where('statut', 'due');
    }

    public function scopePayees($query)
    {
        return $query->where('statut', 'payee');
    }

    // Méthodes
    public function marquerPayee()
    {
        $this->statut = 'payee';
        $this->date_paiement = now();
        $this->save();
    }
}
