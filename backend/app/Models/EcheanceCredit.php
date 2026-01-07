<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EcheanceCredit extends Model
{
    use HasFactory;

    protected $table = 'echeances_credits';

    protected $fillable = [
        'credit_id',
        'numero',
        'date_echeance',
        'montant_capital',
        'montant_interet',
        'montant_total',
        'montant_paye',
        'date_paiement',
        'statut',
    ];

    protected $casts = [
        'date_echeance' => 'date',
        'date_paiement' => 'date',
        'montant_capital' => 'decimal:2',
        'montant_interet' => 'decimal:2',
        'montant_total' => 'decimal:2',
        'montant_paye' => 'decimal:2',
    ];

    // Relations
    public function credit()
    {
        return $this->belongsTo(CreditBancaire::class, 'credit_id');
    }

    public function remboursements()
    {
        return $this->hasMany(RemboursementCredit::class, 'echeance_id');
    }

    // Accessors
    public function getResteAPayerAttribute()
    {
        return $this->montant_total - $this->montant_paye;
    }

    public function getEstEnRetardAttribute()
    {
        return $this->statut !== 'payee' && $this->date_echeance < now();
    }

    // Scopes
    public function scopeAPayer($query)
    {
        return $query->where('statut', 'a_payer');
    }

    public function scopeEnRetard($query)
    {
        return $query->where('statut', '!=', 'payee')
                     ->where('date_echeance', '<', now());
    }

    // Méthodes
    public function enregistrerPaiement($montant)
    {
        $this->montant_paye += $montant;
        
        if ($this->montant_paye >= $this->montant_total) {
            $this->statut = 'payee';
            $this->date_paiement = now();
        }
        
        $this->save();
        
        // Mettre à jour le crédit
        $this->credit->enregistrerRemboursement($montant);
    }
}
