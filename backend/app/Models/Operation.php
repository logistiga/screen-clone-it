<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Operation extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'operations';
    public $incrementing = false;
    protected $keyType = 'string';

    public const STATUSES = ['brouillon', 'validee', 'en_cours', 'terminee', 'annulee'];

    protected $fillable = [
        'numero_operation', 'date_operation',
        'external_client_id', 'snapshot_client_name',
        'type_marchandise', 'description_generale', 'observation_interne',
        'total_transport_fcfa', 'statut',
        'charges_validated_at', 'charges_validated_by',
        'facture_id', 'facture_numero',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'date_operation' => 'date',
        'total_transport_fcfa' => 'integer',
        'charges_validated_at' => 'datetime',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(OperationLine::class)->orderBy('position');
    }

    public function charges(): HasMany
    {
        return $this->hasMany(OperationCharge::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(OperationPayment::class);
    }

    public function bonuses(): HasMany
    {
        return $this->hasMany(OperationBonus::class);
    }
}
