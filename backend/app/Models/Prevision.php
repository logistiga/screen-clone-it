<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prevision extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'titre',
        'description',
        'montant_estime',
        'banque_envisagee',
        'taux_estime',
        'duree_estimee',
        'date_objectif',
        'priorite',
        'statut',
        'notes',
    ];

    protected $casts = [
        'montant_estime' => 'decimal:2',
        'taux_estime' => 'decimal:2',
        'date_objectif' => 'date',
    ];
}
