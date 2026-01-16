<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'facture_id',
        'ordre_id',
        'note_debut_id',
        'client_id',
        'montant',
        'date',
        'mode_paiement',
        'reference',
        'banque_id',
        'numero_cheque',
        'notes',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date' => 'date',
    ];

    // Relations
    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }

    public function ordre()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
    }

    public function noteDebut()
    {
        return $this->belongsTo(NoteDebut::class, 'note_debut_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function banque()
    {
        return $this->belongsTo(Banque::class);
    }

    // Note: La logique de création de mouvement de caisse et mise à jour des montants
    // est gérée exclusivement par PaiementService pour éviter les doublons
}
