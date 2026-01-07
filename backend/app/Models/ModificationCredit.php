<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModificationCredit extends Model
{
    use HasFactory;

    protected $table = 'modifications_credits';

    protected $fillable = [
        'credit_id',
        'type',
        'date_modification',
        'ancienne_valeur',
        'nouvelle_valeur',
        'motif',
        'user_id',
        'document_ref',
    ];

    protected $casts = [
        'date_modification' => 'date',
    ];

    // Relations
    public function credit()
    {
        return $this->belongsTo(CreditBancaire::class, 'credit_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
