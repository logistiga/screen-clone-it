<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationPayment extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'operation_payments';
    public $incrementing = false;
    protected $keyType = 'string';

    public const MODES = ['especes', 'virement', 'cheque', 'mobile_money', 'autre'];

    protected $fillable = [
        'operation_id', 'date_paiement', 'montant_fcfa',
        'mode', 'reference', 'notes',
    ];

    protected $casts = [
        'date_paiement' => 'date',
        'montant_fcfa' => 'integer',
    ];

    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }
}
