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

    protected $fillable = [
        'numero',
        'client_id',
        'date_creation',
        'date_validite',
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
        'statut',
        'notes',
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
    // MÉTHODES PUBLIQUES
    // =========================================

    /**
     * Calculer et sauvegarder les totaux du devis
     */
    public function calculerTotaux(): void
    {
        $this->load(['lignes', 'conteneurs.operations', 'lots']);

        // Récupérer les taux de taxes
        $taxesConfig = Configuration::where('key', 'taxes')->first();
        $tauxTVA = ($taxesConfig->data['tva_taux'] ?? 18) / 100;
        $tauxCSS = ($taxesConfig->data['css_taux'] ?? 1) / 100;

        // Calculer le montant HT selon la catégorie
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

        $montantTVA = $montantHT * $tauxTVA;
        $montantCSS = $montantHT * $tauxCSS;
        $montantTTC = $montantHT + $montantTVA + $montantCSS;

        $this->update([
            'montant_ht' => round($montantHT, 2),
            'tva' => round($montantTVA, 2),
            'css' => round($montantCSS, 2),
            'montant_ttc' => round($montantTTC, 2),
        ]);
    }
}
