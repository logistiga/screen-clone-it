<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TransportOperationLine extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'transport_operation_lines';
    public $incrementing = false;
    protected $keyType = 'string';

    public const TYPES_TRANSPORT = ['conteneur', 'plateau', 'porte_char', 'ac', 'benne', 'autre'];
    public const MODES_TRAJET = ['aller_simple', 'aller_retour', 'retour_simple'];

    protected $fillable = [
        'operation_id', 'point_depart', 'point_arrivee', 'destination_id',
        'description_ligne', 'type_transport', 'mode_trajet',
        'quantite', 'prix_transport_fcfa', 'total_ligne_fcfa',
    ];

    protected $casts = [
        'quantite' => 'integer',
        'prix_transport_fcfa' => 'integer',
        'total_ligne_fcfa' => 'integer',
    ];
}
