<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class OperationLine extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'operation_lines';
    public $incrementing = false;
    protected $keyType = 'string';

    public const TYPES = ['TRANSPORT', 'LOCATION', 'MANUTENTION', 'AUTRE'];

    public const TYPE_MODEL_MAP = [
        'TRANSPORT' => TransportOperationLine::class,
        'LOCATION' => LocationOperationLine::class,
        'MANUTENTION' => ManutentionOperationLine::class,
        'AUTRE' => AutreOperationLine::class,
    ];

    protected $fillable = [
        'operation_id', 'position', 'line_type', 'line_id', 'total_ligne_fcfa',
    ];

    protected $casts = [
        'position' => 'integer',
        'total_ligne_fcfa' => 'integer',
    ];

    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }

    public function line(): MorphTo
    {
        return $this->morphTo(null, 'line_type', 'line_id');
    }

    public function typedLine()
    {
        $class = self::TYPE_MODEL_MAP[$this->line_type] ?? null;
        return $class ? $class::find($this->line_id) : null;
    }
}
