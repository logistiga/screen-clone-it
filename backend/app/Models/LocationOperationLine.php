<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LocationOperationLine extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'location_operation_lines';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'operation_id', 'location_tariff_id', 'libelle',
        'date_debut', 'date_fin', 'nombre_jours',
        'prix_jour_fcfa', 'description_ligne', 'total_ligne_fcfa',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'nombre_jours' => 'integer',
        'prix_jour_fcfa' => 'integer',
        'total_ligne_fcfa' => 'integer',
    ];
}
