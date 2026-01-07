<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RemboursementCredit extends Model
{
    use HasFactory;

    protected $table = 'remboursements_credits';

    protected $fillable = [
        'credit_id',
        'echeance_id',
        'banque_id',
        'montant',
        'date',
        'reference',
        'notes',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date' => 'date',
    ];

    // Relations
    public function credit()
    {
        return $this->belongsTo(CreditBancaire::class, 'credit_id');
    }

    public function echeance()
    {
        return $this->belongsTo(EcheanceCredit::class, 'echeance_id');
    }

    public function banque()
    {
        return $this->belongsTo(Banque::class);
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::created(function ($remboursement) {
            // Enregistrer le paiement sur l'échéance
            if ($remboursement->echeance_id) {
                $remboursement->echeance->enregistrerPaiement($remboursement->montant);
            }

            // Retirer du compte bancaire
            if ($remboursement->banque_id) {
                $remboursement->banque->retirerSolde($remboursement->montant);
            }

            // Créer le mouvement de caisse
            MouvementCaisse::create([
                'type' => 'sortie',
                'montant' => $remboursement->montant,
                'date' => $remboursement->date,
                'description' => 'Remboursement crédit ' . $remboursement->credit->numero,
                'source' => $remboursement->banque_id ? 'banque' : 'caisse',
                'banque_id' => $remboursement->banque_id,
                'categorie' => 'remboursement_credit',
            ]);
        });
    }
}
