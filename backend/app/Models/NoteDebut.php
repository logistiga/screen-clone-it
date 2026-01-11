<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class NoteDebut extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'notes_debut';

    protected $fillable = [
        'numero',
        'type',
        'client_id',
        'ordre_id',
        'facture_id',
        'date_creation',
        'conteneur_numero',
        'conteneur_type',
        'conteneur_taille',
        'navire',
        'armateur_id',
        'transitaire_id',
        'numero_bl',
        'bl_numero',
        'date_arrivee',
        'date_debut',
        'date_fin',
        'date_debut_stockage',
        'date_fin_stockage',
        'jours_franchise',
        'jours_stockage',
        'nombre_jours',
        'tarif_journalier',
        'montant_ht',
        'montant_tva',
        'montant_css',
        'montant_ttc',
        'montant_stockage',
        'montant_manutention',
        'montant_total',
        'montant_paye',
        'montant_avance',
        'taux_tva',
        'taux_css',
        'description',
        'notes',
        'observations',
        'statut',
    ];

    protected $casts = [
        'date_creation' => 'date',
        'date_arrivee' => 'date',
        'date_debut' => 'date',
        'date_fin' => 'date',
        'date_debut_stockage' => 'date',
        'date_fin_stockage' => 'date',
        'montant_ht' => 'decimal:2',
        'montant_tva' => 'decimal:2',
        'montant_css' => 'decimal:2',
        'montant_ttc' => 'decimal:2',
        'montant_stockage' => 'decimal:2',
        'montant_manutention' => 'decimal:2',
        'montant_total' => 'decimal:2',
        'montant_paye' => 'decimal:2',
        'montant_avance' => 'decimal:2',
        'tarif_journalier' => 'decimal:2',
    ];

    // Relations
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function ordre()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
    }

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }

    public function armateur()
    {
        return $this->belongsTo(Armateur::class);
    }

    public function transitaire()
    {
        return $this->belongsTo(Transitaire::class);
    }

    // Méthodes
    public function calculerMontants()
    {
        if ($this->date_debut_stockage && $this->date_fin_stockage) {
            $debut = \Carbon\Carbon::parse($this->date_debut_stockage);
            $fin = \Carbon\Carbon::parse($this->date_fin_stockage);
            $jours = $fin->diffInDays($debut);
            
            $joursFacturables = max(0, $jours - ($this->jours_franchise ?? 0));
            $this->jours_stockage = $joursFacturables;
            $this->montant_stockage = $joursFacturables * ($this->tarif_journalier ?? 0);
        }
        
        $this->montant_total = ($this->montant_stockage ?? 0) + ($this->montant_manutention ?? 0);
        $this->save();
    }

    public static function genererNumero($type = 'detention')
    {
        $prefixes = [
            'detention' => 'ND',
            'ouverture_port' => 'NOP',
            'reparation' => 'NR',
        ];
        
        $prefixe = $prefixes[$type] ?? 'N';
        $annee = date('Y');
        $dernier = self::where('type', $type)->whereYear('created_at', $annee)->count() + 1;
        
        return sprintf('%s-%s-%04d', $prefixe, $annee, $dernier);
    }
}
