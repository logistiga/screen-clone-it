<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LotDevis extends Model
{
    use HasFactory;

    protected $table = 'lots_devis';

    protected $fillable = [
        'devis_id',
        'numero_lot',
        'description',
        'quantite',
        'prix_unitaire',
        'prix_total',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_unitaire' => 'decimal:2',
        'prix_total' => 'decimal:2',
    ];

    // Relations
    public function devis()
    {
        return $this->belongsTo(Devis::class);
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($lot) {
            $lot->prix_total = $lot->quantite * $lot->prix_unitaire;
        });
    }
}
