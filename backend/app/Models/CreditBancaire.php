<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CreditBancaire extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'credits_bancaires';

    protected $fillable = [
        'numero',
        'banque_id',
        'montant_emprunte',
        'taux_interet',
        'duree_en_mois',
        'date_debut',
        'date_fin',
        'mensualite',
        'total_interets',
        'montant_rembourse',
        'statut',
        'objet',
        'notes',
    ];

    protected $casts = [
        'montant_emprunte' => 'decimal:2',
        'taux_interet' => 'decimal:2',
        'mensualite' => 'decimal:2',
        'total_interets' => 'decimal:2',
        'montant_rembourse' => 'decimal:2',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    // Relations
    public function banque()
    {
        return $this->belongsTo(Banque::class);
    }

    public function echeances()
    {
        return $this->hasMany(EcheanceCredit::class, 'credit_id');
    }

    public function remboursements()
    {
        return $this->hasMany(RemboursementCredit::class, 'credit_id');
    }

    public function documents()
    {
        return $this->hasMany(DocumentCredit::class, 'credit_id');
    }

    public function modifications()
    {
        return $this->hasMany(ModificationCredit::class, 'credit_id');
    }

    // Accessors
    public function getResteAPayerAttribute()
    {
        return ($this->montant_emprunte + $this->total_interets) - $this->montant_rembourse;
    }

    public function getPourcentageRembourseAttribute()
    {
        $total = $this->montant_emprunte + $this->total_interets;
        return $total > 0 ? ($this->montant_rembourse / $total) * 100 : 0;
    }

    // Méthodes
    public function calculerEcheancier()
    {
        $this->echeances()->delete();
        
        $capital = $this->montant_emprunte;
        $tauxMensuel = $this->taux_interet / 100 / 12;
        $nbMois = $this->duree_en_mois;
        
        // Calcul de la mensualité (formule d'annuité constante)
        if ($tauxMensuel > 0) {
            $this->mensualite = $capital * $tauxMensuel * pow(1 + $tauxMensuel, $nbMois) 
                              / (pow(1 + $tauxMensuel, $nbMois) - 1);
        } else {
            $this->mensualite = $capital / $nbMois;
        }
        
        $this->total_interets = ($this->mensualite * $nbMois) - $capital;
        $this->save();

        $capitalRestant = $capital;
        $dateEcheance = \Carbon\Carbon::parse($this->date_debut);

        for ($i = 1; $i <= $nbMois; $i++) {
            $dateEcheance = $dateEcheance->copy()->addMonth();
            $interetMois = $capitalRestant * $tauxMensuel;
            $capitalMois = $this->mensualite - $interetMois;
            $capitalRestant -= $capitalMois;

            $this->echeances()->create([
                'numero' => $i,
                'date_echeance' => $dateEcheance,
                'montant_capital' => $capitalMois,
                'montant_interet' => $interetMois,
                'montant_total' => $this->mensualite,
                'montant_paye' => 0,
                'statut' => 'a_payer',
            ]);
        }
    }

    public function enregistrerRemboursement($montant)
    {
        $this->montant_rembourse += $montant;
        
        if ($this->montant_rembourse >= ($this->montant_emprunte + $this->total_interets)) {
            $this->statut = 'termine';
        }
        
        $this->save();
    }

    public static function genererNumero()
    {
        $annee = date('Y');
        $dernier = self::whereYear('created_at', $annee)->count() + 1;
        return sprintf('CR-%s-%04d', $annee, $dernier);
    }
}
