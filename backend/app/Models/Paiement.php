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

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function banque()
    {
        return $this->belongsTo(Banque::class);
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::created(function ($paiement) {
            // Enregistrer le paiement sur la facture ou l'ordre
            if ($paiement->facture_id) {
                $paiement->facture->enregistrerPaiement($paiement->montant);
            }
            
            if ($paiement->ordre_id) {
                $paiement->ordre->enregistrerPaiement($paiement->montant);
            }

            // Créer le mouvement de caisse
            MouvementCaisse::create([
                'type' => 'entree',
                'montant' => $paiement->montant,
                'date' => $paiement->date,
                'description' => 'Paiement ' . ($paiement->facture ? $paiement->facture->numero : $paiement->ordre->numero),
                'paiement_id' => $paiement->id,
                'source' => $paiement->banque_id ? 'banque' : 'caisse',
                'banque_id' => $paiement->banque_id,
            ]);

            // Mettre à jour le solde bancaire si applicable
            if ($paiement->banque_id) {
                $paiement->banque->ajouterSolde($paiement->montant);
            }
        });
    }
}
