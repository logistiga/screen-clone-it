<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConteneurFacture extends Model
{
    use HasFactory;

    protected $table = 'conteneurs_factures';

    protected $fillable = [
        'facture_id',
        'numero',
        'taille',
        'description',
        'prix_unitaire',
    ];

    protected $casts = [
        'prix_unitaire' => 'decimal:2',
    ];

    // Relations
    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }

    public function operations()
    {
        return $this->hasMany(OperationConteneurFacture::class, 'conteneur_id');
    }

    // Accessors
    public function getTotalAttribute()
    {
        return $this->prix_unitaire + $this->operations->sum('prix_total');
    }
}
