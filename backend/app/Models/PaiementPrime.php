<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaiementPrime extends Model
{
    use HasFactory;

    protected $table = 'paiements_primes';

    protected $fillable = [
        'transitaire_id',
        'representant_id',
        'montant',
        'date',
        'mode_paiement',
        'reference',
        'notes',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date' => 'date',
    ];

    // Relations
    public function transitaire()
    {
        return $this->belongsTo(Transitaire::class);
    }

    public function representant()
    {
        return $this->belongsTo(Representant::class);
    }

    public function primes()
    {
        return $this->belongsToMany(Prime::class, 'paiement_prime_items');
    }
}
