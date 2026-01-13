<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Devis extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'devis';

    // Champs modifiables par l'utilisateur uniquement
    // Les champs calculés (montants, taxes) et générés (numero) sont exclus
    protected $fillable = [
        'client_id',
        'date_validite',
        'categorie',
        'type_operation',
        'type_operation_indep',
        'armateur_id',
        'transitaire_id',
        'representant_id',
        'navire',
        'numero_bl',
        'remise_type',
        'remise_valeur',
        'statut',
        'notes',
    ];

    // Champs calculés/générés (non mass-assignable pour sécurité)
    protected $guarded_calculated = [
        'numero',
        'date_creation',
        'montant_ht',
        'remise_montant',
        'tva',
        'css',
        'montant_ttc',
    ];

    protected $casts = [
        'date_creation' => 'date',
        'date_validite' => 'date',
        'montant_ht' => 'decimal:2',
        'tva' => 'decimal:2',
        'css' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
    ];

    // =========================================
    // RELATIONS
    // =========================================

    public function client()
    {
        return $this->belongsTo(Client::class);
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
        return $this->hasMany(LigneDevis::class);
    }

    public function conteneurs()
    {
        return $this->hasMany(ConteneurDevis::class);
    }

    public function lots()
    {
        return $this->hasMany(LotDevis::class);
    }

    public function ordre()
    {
        return $this->hasOne(OrdreTravail::class);
    }

    public function annulation()
    {
        return $this->hasOne(Annulation::class, 'document_id')->where('type', 'devis');
    }

    // =========================================
    // MÉTHODES STATIQUES
    // =========================================

    /**
     * Générer un numéro unique de devis
     */
    public static function genererNumero(): string
    {
        $annee = date('Y');

        return DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();

            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'] ?? [
                        'prefixe_devis' => 'DEV',
                        'prochain_numero_devis' => 1,
                    ],
                ]);
            }

            $prefixe = $config->data['prefixe_devis'] ?? 'DEV';

            // Trouver le numéro max existant
            $maxNumero = self::withTrashed()
                ->where('numero', 'like', $prefixe . '-' . $annee . '-%')
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = max(($maxNumero ?? 0) + 1, $config->data['prochain_numero_devis'] ?? 1);

            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);

            // Vérifier unicité
            while (self::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            // Mettre à jour le compteur
            $data = $config->data;
            $data['prochain_numero_devis'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return $numero;
        });
    }

    // =========================================
    // SCOPES
    // =========================================

    /**
     * Scope pour recherche textuelle
     */
    public function scopeSearch($query, ?string $term)
    {
        if (empty($term)) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('numero', 'like', "%{$term}%")
              ->orWhere('navire', 'like', "%{$term}%")
              ->orWhere('numero_bl', 'like', "%{$term}%")
              ->orWhereHas('client', function ($q) use ($term) {
                  $q->where('nom', 'like', "%{$term}%");
              });
        });
    }

    /**
     * Scope pour filtrer par statut
     */
    public function scopeStatut($query, ?string $statut)
    {
        if (empty($statut)) {
            return $query;
        }

        return $query->where('statut', $statut);
    }

    /**
     * Scope pour filtrer par client
     */
    public function scopeClient($query, ?int $clientId)
    {
        if (empty($clientId)) {
            return $query;
        }

        return $query->where('client_id', $clientId);
    }

    /**
     * Scope pour filtrer par plage de dates
     */
    public function scopeDateRange($query, ?string $dateDebut, ?string $dateFin)
    {
        if ($dateDebut) {
            $query->whereDate('date_creation', '>=', $dateDebut);
        }

        if ($dateFin) {
            $query->whereDate('date_creation', '<=', $dateFin);
        }

        return $query;
    }

    /**
     * Scope pour chargement léger (liste)
     */
    public function scopeLite($query)
    {
        return $query->with(['client:id,nom', 'armateur:id,nom', 'transitaire:id,nom']);
    }

    /**
     * Scope pour chargement complet (détail)
     */
    public function scopeFull($query)
    {
        return $query->with([
            'client',
            'armateur',
            'transitaire',
            'representant',
            'lignes',
            'conteneurs.operations',
            'lots',
            'ordre',
            'annulation',
        ]);
    }

    // =========================================
    // MÉTHODES PUBLIQUES
    // =========================================

    /**
     * Calculer et sauvegarder les totaux du devis (avec remise)
     */
    public function calculerTotaux(): void
    {
        $this->load(['lignes', 'conteneurs.operations', 'lots']);

        // Récupérer les taux de taxes
        $taxesConfig = Configuration::where('key', 'taxes')->first();
        $tauxTVA = ($taxesConfig->data['tva_taux'] ?? 18) / 100;
        $tauxCSS = ($taxesConfig->data['css_taux'] ?? 1) / 100;

        // Calculer le montant HT brut selon la catégorie
        $montantHTBrut = $this->calculerMontantHTBrut();

        // Appliquer la remise
        $remiseMontant = $this->calculerRemise($montantHTBrut);
        $montantHT = $montantHTBrut - $remiseMontant;

        // Calculer les taxes sur le montant HT après remise
        $montantTVA = $montantHT * $tauxTVA;
        $montantCSS = $montantHT * $tauxCSS;
        $montantTTC = $montantHT + $montantTVA + $montantCSS;

        // Mise à jour directe sans passer par fillable
        $this->forceFill([
            'montant_ht' => round($montantHT, 2),
            'remise_montant' => round($remiseMontant, 2),
            'tva' => round($montantTVA, 2),
            'css' => round($montantCSS, 2),
            'montant_ttc' => round($montantTTC, 2),
        ])->save();
    }

    /**
     * Calculer le montant HT brut (avant remise)
     */
    protected function calculerMontantHTBrut(): float
    {
        $montantHT = 0;

        switch ($this->categorie) {
            case 'conteneurs':
                foreach ($this->conteneurs as $conteneur) {
                    $montantHT += (float) ($conteneur->prix_unitaire ?? 0);
                    foreach ($conteneur->operations as $op) {
                        $montantHT += (float) $op->quantite * (float) $op->prix_unitaire;
                    }
                }
                break;

            case 'conventionnel':
                foreach ($this->lots as $lot) {
                    $montantHT += (float) $lot->quantite * (float) $lot->prix_unitaire;
                }
                break;

            case 'operations_independantes':
                foreach ($this->lignes as $ligne) {
                    $montantHT += (float) $ligne->quantite * (float) $ligne->prix_unitaire;
                }
                break;
        }

        return $montantHT;
    }

    /**
     * Calculer le montant de la remise
     */
    protected function calculerRemise(float $montantHTBrut): float
    {
        if (empty($this->remise_valeur) || $this->remise_valeur <= 0) {
            return 0;
        }

        if ($this->remise_type === 'pourcentage') {
            return $montantHTBrut * ((float) $this->remise_valeur / 100);
        }

        // Remise en montant fixe
        return min((float) $this->remise_valeur, $montantHTBrut);
    }
}
