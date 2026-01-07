<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Banque extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'numero_compte',
        'rib',
        'iban',
        'swift',
        'solde',
        'actif',
    ];

    protected $casts = [
        'solde' => 'decimal:2',
        'actif' => 'boolean',
    ];

    // Relations
    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    public function mouvements()
    {
        return $this->hasMany(MouvementCaisse::class)->where('source', 'banque');
    }

    public function credits()
    {
        return $this->hasMany(CreditBancaire::class);
    }

    public function remboursements()
    {
        return $this->hasMany(RemboursementCredit::class);
    }

    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    // Méthodes
    public function ajouterSolde($montant)
    {
        $this->solde += $montant;
        $this->save();
    }

    public function retirerSolde($montant)
    {
        $this->solde -= $montant;
        $this->save();
    }
}
