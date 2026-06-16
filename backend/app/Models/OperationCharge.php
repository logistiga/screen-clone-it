<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationCharge extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'operation_charges';
    public $incrementing = false;
    protected $keyType = 'string';

    public const SOURCES = ['auto_transport', 'manual'];

    protected $fillable = [
        'operation_id', 'line_position', 'line_type',
        'source', 'libelle', 'montant_fcfa', 'details',
    ];

    protected $casts = [
        'line_position' => 'integer',
        'montant_fcfa' => 'integer',
    ];

    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }
}
