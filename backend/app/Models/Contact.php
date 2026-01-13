<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'nom',
        'fonction',
        'email',
        'telephone',
        'est_principal',
        'notes',
    ];

    protected $casts = [
        'est_principal' => 'boolean',
    ];

    // Relations
    public function client()
    {
        return $this->belongsTo(Client::class);
    }
}
