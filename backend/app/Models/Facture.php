<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Facture extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'numero',
        'ordre_id',
        'client_id',
        'date_creation',
        'date_echeance',
        'categorie',
        'type_operation',
        'type_operation_indep',
        'armateur_id',
        'transitaire_id',
        'representant_id',
        'navire',
        'numero_bl',
        'montant_ht',
        'tva',
        'css',
        'montant_ttc',
        'montant_paye',
        'statut',
        'notes',
        'token_verification',
    ];

    protected $casts = [
        'date_creation' => 'date',
        'date_echeance' => 'date',
        'montant_ht' => 'decimal:2',
        'tva' => 'decimal:2',
        'css' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'montant_paye' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($facture) {
            $facture->token_verification = \Str::random(32);
        });
    }

    // Relations
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function ordre()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
    }

    public function armateur()
    {
        return $this->belongsTo(Armateur::class);
    }

    public function transitaire()
    {
        return $this->belongsTo(Transitaire::class);
    }

    public function representant()
    {
        return $this->belongsTo(Representant::class);
    }

    public function lignes()
    {
        return $this->hasMany(LigneFacture::class);
    }

    public function conteneurs()
    {
        return $this->hasMany(ConteneurFacture::class);
    }

    public function lots()
    {
        return $this->hasMany(LotFacture::class);
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    public function annulation()
    {
        return $this->hasOne(Annulation::class, 'document_id')->where('type', 'facture');
    }

    // Accessors
    public function getResteAPayerAttribute()
    {
        return $this->montant_ttc - $this->montant_paye;
    }

    public function getEstEnRetardAttribute()
    {
        return $this->statut !== 'payee' && 
               $this->statut !== 'annulee' && 
               $this->date_echeance < now();
    }

    // Méthodes
    public function calculerTotaux()
    {
        $tauxTva = config('logistiga.taux_tva', 18) / 100;
        $tauxCss = config('logistiga.taux_css', 1) / 100;

        if ($this->categorie === 'conteneurs') {
            $this->montant_ht = $this->conteneurs->sum(function ($c) {
                return $c->prix_unitaire + $c->operations->sum('prix_total');
            });
        } elseif ($this->categorie === 'conventionnel') {
            $this->montant_ht = $this->lots->sum('prix_total');
        } else {
            $this->montant_ht = $this->lignes->sum('montant_ht');
        }

        $this->tva = $this->montant_ht * $tauxTva;
        $this->css = $this->montant_ht * $tauxCss;
        $this->montant_ttc = $this->montant_ht + $this->tva + $this->css;
        
        $this->save();
    }

    public function enregistrerPaiement($montant)
    {
        $this->montant_paye += $montant;
        
        if ($this->montant_paye >= $this->montant_ttc) {
            $this->statut = 'payee';
        } elseif ($this->montant_paye > 0) {
            $this->statut = 'partielle';
        }
        
        $this->save();
        
        // Recalculer le solde client
        $this->client->calculerSolde();
    }

    public static function genererNumero()
    {
        $config = Configuration::getOrCreate('numerotation');
        $prefixe = $config->data['prefixe_facture'] ?? 'FAC';
        $annee = date('Y');
        $prochain = $config->data['prochain_numero_facture'] ?? 1;

        $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochain);

        $config->data['prochain_numero_facture'] = $prochain + 1;
        $config->save();

        return $numero;
    }
}
