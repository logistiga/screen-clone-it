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
    ];

    protected $casts = [
        'date_creation' => 'date',
        'montant_ht' => 'decimal:2',
        'tva' => 'decimal:2',
        'css' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'montant_paye' => 'decimal:2',
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

    public function facture()
    {
        return $this->hasOne(Facture::class, 'ordre_id');
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'ordre_id');
    }

    public function primes()
    {
        return $this->hasMany(Prime::class, 'ordre_id');
    }

    public function annulation()
    {
        return $this->hasOne(Annulation::class, 'document_id')->where('type', 'ordre');
    }

    // Accessors
    public function getResteAPayerAttribute()
    {
        return $this->montant_ttc - $this->montant_paye;
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
            $this->statut = 'termine';
        }
        
        $this->save();
    }

    public function convertirEnFacture()
    {
        $facture = Facture::create([
            'numero' => Facture::genererNumero(),
            'ordre_id' => $this->id,
            'client_id' => $this->client_id,
            'date_creation' => now()->toDateString(),
            'date_echeance' => now()->addDays(30)->toDateString(),
            'categorie' => $this->categorie,
            'type_operation' => $this->type_operation,
            'type_operation_indep' => $this->type_operation_indep,
            'armateur_id' => $this->armateur_id,
            'transitaire_id' => $this->transitaire_id,
            'representant_id' => $this->representant_id,
            'navire' => $this->navire,
            'numero_bl' => $this->numero_bl,
            'montant_ht' => $this->montant_ht,
            'tva' => $this->tva,
            'css' => $this->css,
            'montant_ttc' => $this->montant_ttc,
            'montant_paye' => $this->montant_paye,
            'statut' => $this->montant_paye >= $this->montant_ttc ? 'payee' : 'emise',
            'notes' => $this->notes,
        ]);

        // Copier les lignes/conteneurs/lots
        foreach ($this->lignes as $ligne) {
            $facture->lignes()->create($ligne->toArray());
        }

        foreach ($this->conteneurs as $conteneur) {
            $newConteneur = $facture->conteneurs()->create($conteneur->toArray());
            foreach ($conteneur->operations as $op) {
                $newConteneur->operations()->create($op->toArray());
            }
        }

        foreach ($this->lots as $lot) {
            $facture->lots()->create($lot->toArray());
        }

        $this->statut = 'facture';
        $this->save();

        return $facture;
    }

    public static function genererNumero(): string
    {
        $annee = date('Y');

        return DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();

            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'] ?? [
                        'prefixe_ordre' => 'OT',
                        'prochain_numero_ordre' => 1,
                    ],
                ]);
            }

            $prefixe = $config->data['prefixe_ordre'] ?? 'OT';

            // Trouver le numéro max existant (évite les doublons si le compteur est désynchronisé)
            $maxNumero = self::withTrashed()
                ->where('numero', 'like', $prefixe . '-' . $annee . '-%')
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = max(
                ($maxNumero ?? 0) + 1,
                $config->data['prochain_numero_ordre'] ?? 1
            );

            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);

            while (self::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            $data = $config->data;
            $data['prochain_numero_ordre'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return $numero;
        });
    }
}
