<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentCredit extends Model
{
    use HasFactory;

    protected $table = 'documents_credits';

    protected $fillable = [
        'credit_id',
        'type',
        'nom',
        'chemin',
        'version',
        'taille',
        'user_id',
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
