<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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

    // Relations
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

    // Méthodes
    public function calculerTotaux()
    {
        $tauxTva = config('logistiga.taux_tva', 18) / 100;
        $tauxCss = config('logistiga.taux_css', 1) / 100;

        // Calcul selon la catégorie
        if ($this->categorie === 'conteneurs') {
            $this->montant_ht = $this->conteneurs->sum(function ($c) {
                return $c->prix_unitaire + $c->operations->sum('prix_total');
            });
        } elseif ($this->categorie === 'conventionnel') {
            $this->montant_ht = $this->lots->sum('prix_total');
        } else {
            $this->montant_ht = $this->lignes->sum('montant_ht');
        }

        $this->montant_tva = $this->montant_ht * $tauxTva;
        $this->montant_css = $this->montant_ht * $tauxCss;
        $this->montant_ttc = $this->montant_ht + $this->montant_tva + $this->montant_css;
        
        $this->save();
    }

    public function convertirEnOrdre()
    {
        $ordre = OrdreTravail::create([
            'numero' => OrdreTravail::genererNumero(),
            'devis_id' => $this->id,
            'client_id' => $this->client_id,
            'date_creation' => now(),
            'categorie' => $this->categorie,
            'type_operation' => $this->type_operation,
            'type_operation_indep' => $this->type_operation_indep,
            'armateur_id' => $this->armateur_id,
            'transitaire_id' => $this->transitaire_id,
            'representant_id' => $this->representant_id,
            'navire' => $this->navire,
            'bl_numero' => $this->bl_numero,
            'montant_ht' => $this->montant_ht,
            'montant_tva' => $this->montant_tva,
            'montant_css' => $this->montant_css,
            'montant_ttc' => $this->montant_ttc,
            'montant_paye' => 0,
            'statut' => 'en_cours',
            'notes' => $this->notes,
        ]);

        // Copier les lignes/conteneurs/lots
        foreach ($this->lignes as $ligne) {
            $ordre->lignes()->create($ligne->toArray());
        }

        foreach ($this->conteneurs as $conteneur) {
            $newConteneur = $ordre->conteneurs()->create($conteneur->toArray());
            foreach ($conteneur->operations as $op) {
                $newConteneur->operations()->create($op->toArray());
            }
        }

        foreach ($this->lots as $lot) {
            $ordre->lots()->create($lot->toArray());
        }

        $this->statut = 'accepte';
        $this->save();

        return $ordre;
    }

    public static function genererNumero()
    {
        $annee = date('Y');

        return \Illuminate\Support\Facades\DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();
            
            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'],
                ]);
            }

            $prefixe = $config->data['prefixe_devis'] ?? 'DEV';

            // Chercher le dernier numéro de devis existant cette année
            $dernierDevis = self::whereYear('created_at', $annee)
                ->orderBy('id', 'desc')
                ->first();

            $prochainNumero = 1;
            if ($dernierDevis && preg_match('/-(\d{4})$/', $dernierDevis->numero, $matches)) {
                $prochainNumero = intval($matches[1]) + 1;
            }

            // S'assurer que le numéro est au moins égal au compteur stocké
            $compteurStocke = $config->data['prochain_numero_devis'] ?? 1;
            if ($prochainNumero < $compteurStocke) {
                $prochainNumero = $compteurStocke;
            }

            // Mettre à jour le compteur
            $data = $config->data;
            $data['prochain_numero_devis'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
        });
    }
}
