<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

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
        'remise_montant',
        'created_by',
        // Exonérations
        'exonere_tva',
        'exonere_css',
        'motif_exoneration',
        // Nouvelle sélection dynamique des taxes
        'taxes_selection',
        // Synchronisation Logistiga
        'logistiga_synced_at',
    ];

    protected $casts = [
        'date_creation' => 'date',
        'date_envoi' => 'datetime',
        'montant_ht' => 'decimal:2',
        'tva' => 'decimal:2',
        'css' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'taux_tva' => 'decimal:2',
        'taux_css' => 'decimal:2',
        'remise_valeur' => 'decimal:2',
        'remise_montant' => 'decimal:2',
        'exonere_tva' => 'boolean',
        'exonere_css' => 'boolean',
        'taxes_selection' => 'array',
        'logistiga_synced_at' => 'datetime',
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

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Accessors
    /**
     * Calculer le montant effectif (tenant compte des exonérations)
     */
    public function getMontantEffectifAttribute(): float
    {
        $montantHTNet = (float) $this->montant_ht - (float) ($this->remise_montant ?? 0);
        $tvaEffective = $this->exonere_tva ? 0 : (float) $this->tva;
        $cssEffective = $this->exonere_css ? 0 : (float) $this->css;
        
        return $montantHTNet + $tvaEffective + $cssEffective;
    }

    public function getResteAPayerAttribute(): float
    {
        // Si exonération, utiliser le montant effectif
        if ($this->exonere_tva || $this->exonere_css) {
            return max(0, $this->montant_effectif - (float) ($this->montant_paye ?? 0));
        }
        return max(0, (float) $this->montant_ttc - (float) ($this->montant_paye ?? 0));
    }

    public function getEstPayeAttribute(): bool
    {
        $montantTotal = ($this->exonere_tva || $this->exonere_css) 
            ? $this->montant_effectif 
            : (float) $this->montant_ttc;
        return (float) ($this->montant_paye ?? 0) >= $montantTotal;
    }

    public function getEstFactureAttribute(): bool
    {
        return $this->facture()->exists();
    }

    /**
     * Calculer le montant de la remise en fonction du type et de la valeur.
     */
    public function calculerRemise(float $montantHTBrut): float
    {
        // Pas de remise si type null/none ou valeur <= 0
        if (empty($this->remise_type) || $this->remise_type === 'none') {
            return 0;
        }

        if (empty($this->remise_valeur) || $this->remise_valeur <= 0) {
            return 0;
        }

        if ($this->remise_type === 'pourcentage') {
            return $montantHTBrut * ((float) $this->remise_valeur / 100);
        }

        // Remise en montant fixe
        return min((float) $this->remise_valeur, $montantHTBrut);
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

    /**
     * Générer un numéro d'ordre unique
     */
    public static function genererNumero(): string
    {
        $annee = date('Y');
        
        return DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();
            
            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'],
                ]);
            }
            
            $prefixe = $config->data['prefixe_ordre'] ?? 'OT';

            // Trouver le numéro maximum existant
            $maxNumero = self::withTrashed()
                ->where('numero', 'like', $prefixe . '-' . $annee . '-%')
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = ($maxNumero ?? 0) + 1;

            // S'assurer que le numéro est au moins égal au compteur stocké
            $compteurStocke = $config->data['prochain_numero_ordre'] ?? 1;
            if ($prochainNumero < $compteurStocke) {
                $prochainNumero = $compteurStocke;
            }

            // Vérifier l'unicité
            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            while (self::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            // Mettre à jour le compteur
            $data = $config->data;
            $data['prochain_numero_ordre'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return $numero;
        });
    }
}
