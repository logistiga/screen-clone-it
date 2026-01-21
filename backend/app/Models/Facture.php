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
        'remise_type',
        'remise_valeur',
        'remise_montant',
        'tva',
        'css',
        'montant_ttc',
        'montant_paye',
        'statut',
        'notes',
        'token_verification',
        'created_by',
        // Exonérations
        'exonere_tva',
        'exonere_css',
        'motif_exoneration',
    ];

    protected $casts = [
        'date_creation' => 'date',
        'date_echeance' => 'date',
        'date_envoi' => 'datetime',
        'montant_ht' => 'decimal:2',
        'tva' => 'decimal:2',
        'css' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'remise_valeur' => 'decimal:2',
        'remise_montant' => 'decimal:2',
        'exonere_tva' => 'boolean',
        'exonere_css' => 'boolean',
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

    public function ordreTravail()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
    }

    // Alias pour compatibilité
    public function ordre()
    {
        return $this->ordreTravail();
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

    public function primes()
    {
        return $this->hasMany(Prime::class, 'facture_id');
    }

    public function annulation()
    {
        return $this->hasOne(Annulation::class, 'document_id')->where('type', 'facture');
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

    public function getEstEnRetardAttribute(): bool
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

    public static function genererNumero(): string
    {
        $annee = date('Y');

        return \Illuminate\Support\Facades\DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();

            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'] ?? [
                        'prefixe_facture' => 'FAC',
                        'prochain_numero_facture' => 1,
                    ],
                ]);
            }

            $data = $config->data;
            $prefixe = $data['prefixe_facture'] ?? 'FAC';

            $maxNumero = self::withTrashed()
                ->where('numero', 'like', $prefixe . '-' . $annee . '-%')
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = max(
                ($maxNumero ?? 0) + 1,
                $data['prochain_numero_facture'] ?? 1
            );

            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);

            while (self::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            $data['prochain_numero_facture'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return $numero;
        });
    }
}
