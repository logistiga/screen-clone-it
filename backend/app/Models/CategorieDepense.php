<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CategorieDepense extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'categories_depenses';

    protected $fillable = [
        'nom',
        'description',
        'type',
        'couleur',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    // Relations
    public function mouvements()
    {
        return $this->hasMany(MouvementCaisse::class, 'categorie_depense_id');
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeSorties($query)
    {
        return $query->where('type', 'Sortie');
    }

    public function scopeEntrees($query)
    {
        return $query->where('type', 'Entrée');
    }

    // Accessors
    public function getTotalDepensesAttribute()
    {
        return $this->mouvements()->where('type', 'Sortie')->sum('montant');
    }

    public function getNombreMouvementsAttribute()
    {
        return $this->mouvements()->count();
    }
}
