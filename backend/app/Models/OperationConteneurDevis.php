<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperationConteneurDevis extends Model
{
    use HasFactory;

    protected $table = 'operations_conteneurs_devis';

    protected $fillable = [
        'conteneur_id',
        'type',
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
    public function conteneur()
    {
        return $this->belongsTo(ConteneurDevis::class, 'conteneur_id');
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($operation) {
            $operation->prix_total = (float) ($operation->quantite ?? 1) * (float) ($operation->prix_unitaire ?? 0);
        });
    }
}
