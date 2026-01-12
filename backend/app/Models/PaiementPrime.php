<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaiementPrime extends Model
{
    use HasFactory;

    protected $table = 'paiements_primes';

    protected $fillable = [
        'numero_recu',
        'transitaire_id',
        'representant_id',
        'montant',
        'date',
        'mode_paiement',
        'reference',
        'notes',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($paiement) {
            if (empty($paiement->numero_recu)) {
                $paiement->numero_recu = self::generateNumeroRecu();
            }
        });
    }

    public static function generateNumeroRecu(): string
    {
        $prefix = 'REC-PRI';
        $year = date('Y');
        $month = date('m');
        
        // Trouver le dernier numéro de reçu du mois
        $lastRecu = self::where('numero_recu', 'like', "{$prefix}-{$year}{$month}%")
            ->orderBy('numero_recu', 'desc')
            ->first();
        
        if ($lastRecu) {
            $lastNumber = (int) substr($lastRecu->numero_recu, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return sprintf('%s-%s%s-%04d', $prefix, $year, $month, $newNumber);
    }

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
