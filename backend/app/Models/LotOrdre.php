<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LotOrdre extends Model
{
    use HasFactory;

    protected $table = 'lots_ordres';

    protected $fillable = [
        'ordre_id',
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
    public function ordre()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
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
