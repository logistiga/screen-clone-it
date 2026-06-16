<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationBonus extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'operation_bonuses';
    public $incrementing = false;
    protected $keyType = 'string';

    public const KINDS = ['prime', 'commission'];
    public const BENEFICIARY_TYPES = ['chauffeur', 'responsable', 'autre'];
    public const SOURCES = ['auto', 'manual'];

    protected $fillable = [
        'operation_id', 'line_position', 'line_type',
        'kind', 'beneficiary_type', 'beneficiary_name',
        'montant_fcfa', 'source', 'details',
        'validated_at', 'validated_by',
    ];

    protected $casts = [
        'line_position' => 'integer',
        'montant_fcfa' => 'integer',
        'validated_at' => 'datetime',
    ];

    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }
}
