<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConteneurOrdre extends Model
{
    use HasFactory;

    protected $table = 'conteneurs_ordres';

    protected $fillable = [
        'ordre_id',
        'numero',
        'taille',
        'description',
        'prix_unitaire',
    ];

    protected $casts = [
        'prix_unitaire' => 'decimal:2',
    ];

    // Relations
    public function ordre()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
    }

    public function operations()
    {
        return $this->hasMany(OperationConteneurOrdre::class, 'conteneur_id');
    }

    // Accessors
    public function getTotalAttribute()
    {
        return $this->prix_unitaire + $this->operations->sum('prix_total');
    }
}
