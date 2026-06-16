<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ManutentionOperationLine extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'manutention_operation_lines';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'operation_id', 'location_tariff_id', 'libelle',
        'description_ligne', 'quantite',
        'prix_unitaire_fcfa', 'total_ligne_fcfa',
    ];

    protected $casts = [
        'quantite' => 'integer',
        'prix_unitaire_fcfa' => 'integer',
        'total_ligne_fcfa' => 'integer',
    ];
}
