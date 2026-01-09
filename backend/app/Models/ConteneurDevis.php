<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConteneurDevis extends Model
{
    use HasFactory;

    protected $table = 'conteneurs_devis';

    protected $fillable = [
        'devis_id',
        'numero',
        'taille',
        'description',
        'prix_unitaire',
    ];

    protected $casts = [
        'prix_unitaire' => 'decimal:2',
    ];

    // Relations
    public function devis()
    {
        return $this->belongsTo(Devis::class);
    }

    public function operations()
    {
        return $this->hasMany(OperationConteneurDevis::class, 'conteneur_id');
    }

    // Accessors
    public function getTotalAttribute(): float
    {
        return (float) ($this->prix_unitaire ?? 0) + $this->operations->sum('prix_total');
    }
}
