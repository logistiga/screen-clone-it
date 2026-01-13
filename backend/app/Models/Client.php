<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'pays',
        'type',
        'rccm',
        'nif',
        'contact_principal',
        'solde',
        'limite_credit',
        'notes',
    ];

    protected $casts = [
        'solde' => 'decimal:2',
        'limite_credit' => 'decimal:2',
    ];

    // Relations
    public function devis()
    {
        return $this->hasMany(Devis::class);
    }

    public function ordresTravail()
    {
        return $this->hasMany(OrdreTravail::class);
    }

    public function factures()
    {
        return $this->hasMany(Facture::class);
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    public function annulations()
    {
        return $this->hasMany(Annulation::class);
    }

    public function avoirsDisponibles()
    {
        return $this->hasMany(Annulation::class)
            ->where('avoir_genere', true)
            ->where('solde_avoir', '>', 0);
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    public function contactPrincipal()
    {
        return $this->hasOne(Contact::class)->where('est_principal', true);
    }
}
