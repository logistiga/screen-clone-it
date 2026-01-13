<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrdreTravail extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ordres_travail';

    protected $fillable = [
        'numero',
        'devis_id',
        'client_id',
        'date_creation',
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
        'taux_tva',
        'taux_css',
        'remise_type',
        'remise_valeur',
    ];

    protected $casts = [
        'date_creation' => 'date',
        'montant_ht' => 'decimal:2',
        'tva' => 'decimal:2',
        'css' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'taux_tva' => 'decimal:2',
        'taux_css' => 'decimal:2',
        'remise_valeur' => 'decimal:2',
    ];

    // Relations
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function devis()
    {
        return $this->belongsTo(Devis::class);
    }

    public function facture()
    {
        return $this->hasOne(Facture::class, 'ordre_id');
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
        return $this->hasMany(LigneOrdre::class, 'ordre_id');
    }

    public function conteneurs()
    {
        return $this->hasMany(ConteneurOrdre::class, 'ordre_id');
    }

    public function lots()
    {
        return $this->hasMany(LotOrdre::class, 'ordre_id');
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'ordre_id');
    }

    public function primes()
    {
        return $this->hasMany(Prime::class, 'ordre_id');
    }

    // Accessors
    public function getResteAPayerAttribute()
    {
        return max(0, $this->montant_ttc - $this->montant_paye);
    }

    public function getEstPayeAttribute()
    {
        return $this->montant_paye >= $this->montant_ttc;
    }

    public function getEstFactureAttribute()
    {
        return $this->facture()->exists();
    }

    // Scopes
    public function scopeEnCours($query)
    {
        return $query->where('statut', 'en_cours');
    }

    public function scopeTermine($query)
    {
        return $query->where('statut', 'termine');
    }

    public function scopeFacture($query)
    {
        return $query->where('statut', 'facture');
    }

    public function scopeNonFacture($query)
    {
        return $query->where('statut', '!=', 'facture');
    }

    public function scopeCategorie($query, $categorie)
    {
        return $query->where('categorie', $categorie);
    }
}
