<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LigneDevis extends Model
{
    use HasFactory;

    protected $table = 'lignes_devis';

    protected $fillable = [
        'devis_id',
        'description',
        'quantite',
        'prix_unitaire',
        'montant_ht',
        'lieu_depart',
        'lieu_arrivee',
        'date_debut',
        'date_fin',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_unitaire' => 'decimal:2',
        'montant_ht' => 'decimal:2',
        'date_debut' => 'date',
        'date_fin' => 'date',
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

        static::saving(function ($ligne) {
            $ligne->montant_ht = $ligne->quantite * $ligne->prix_unitaire;
        });
    }
}
