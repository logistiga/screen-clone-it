<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prime extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUT_EN_ATTENTE = 'En attente';
    public const STATUT_VALIDEE = 'Validée';
    public const STATUT_PARTIELLEMENT_VALIDEE = 'Partiellement validée';
    public const STATUT_PAYEE = 'Payée';

    public static function statutsEnAttentePaiement(): array
    {
        return [self::STATUT_EN_ATTENTE, 'Partiellement payée', self::STATUT_PARTIELLEMENT_VALIDEE];
    }

    public static function statutsValidesPourCaisse(): array
    {
        return [
            self::STATUT_VALIDEE,
            'Validee',
            'validee',
            self::STATUT_PARTIELLEMENT_VALIDEE,
            'Partiellement validee',
            self::STATUT_PAYEE,
            'Payee',
            'payee',
            'Partiellement payée',
            'Partiellement payee',
        ];
    }

    public static function statutsPayes(): array
    {
        return [self::STATUT_PAYEE, 'Payee', 'payee'];
    }

    protected $fillable = [
        'ordre_id',
        'facture_id',
        'transitaire_id',
        'representant_id',
        'montant',
        'description',
        'statut',
        'date_paiement',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'date',
    ];

    // Relations
    public function paiements()
    {
        return $this->belongsToMany(\App\Models\PaiementPrime::class, 'paiement_prime_items', 'prime_id', 'paiement_prime_id');
    }

    // Relations
    public function ordre()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
    }

    public function transitaire()
    {
        return $this->belongsTo(Transitaire::class);
    }

    public function representant()
    {
        return $this->belongsTo(Representant::class);
    }

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }

    // Scopes
    public function scopeDues($query)
    {
        return $query->whereIn('statut', self::statutsEnAttentePaiement());
    }

    public function scopePayees($query)
    {
        return $query->whereIn('statut', self::statutsPayes());
    }

    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'En attente');
    }

    public function scopePartiellementPayees($query)
    {
        return $query->where('statut', 'Partiellement payée');
    }

    // Méthodes
    public function marquerPayee()
    {
        $this->statut = self::STATUT_PAYEE;
        $this->date_paiement = now();
        $this->save();
    }
}
