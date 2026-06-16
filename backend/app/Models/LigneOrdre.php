<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LigneOrdre extends Model
{
    use HasFactory;

    protected $table = 'lignes_ordres';

    protected $fillable = [
        'ordre_id',
        'type_operation',
        'description',
        'quantite',
        'prix_unitaire',
        'montant_ht',
        'lieu_depart',
        'lieu_arrivee',
        'date_debut',
        'date_fin',
        'point_depart',
        'point_arrivee',
        'type_transport',
        'mode_trajet',
        'materiel',
        'nombre_jours',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_unitaire' => 'decimal:2',
        'montant_ht' => 'decimal:2',
        'date_debut' => 'date',
        'date_fin' => 'date',
        'nombre_jours' => 'integer',
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

        static::saving(function ($ligne) {
            $ligne->montant_ht = $ligne->quantite * $ligne->prix_unitaire;
        });
    }
}
