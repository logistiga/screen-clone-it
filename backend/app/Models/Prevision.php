<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prevision extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'type',
        'categorie',
        'description',
        'montant_prevu',
        'realise_caisse',
        'realise_banque',
        'mois',
        'annee',
        'statut',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'montant_prevu' => 'decimal:2',
        'realise_caisse' => 'decimal:2',
        'realise_banque' => 'decimal:2',
        'mois' => 'integer',
        'annee' => 'integer',
    ];

    protected $appends = ['montant_realise', 'ecart', 'taux_realisation', 'mois_nom'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Montant total réalisé (caisse + banque)
     */
    public function getMontantRealiseAttribute(): float
    {
        return (float) $this->realise_caisse + (float) $this->realise_banque;
    }

    /**
     * Écart entre réalisé et prévu
     */
    public function getEcartAttribute(): float
    {
        return $this->montant_realise - (float) $this->montant_prevu;
    }

    /**
     * Taux de réalisation en pourcentage
     */
    public function getTauxRealisationAttribute(): float
    {
        if ((float) $this->montant_prevu == 0) return 0;
        return round(($this->montant_realise / (float) $this->montant_prevu) * 100, 2);
    }

    /**
     * Nom du mois
     */
    public function getMoisNomAttribute(): string
    {
        $moisNoms = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];
        return $moisNoms[$this->mois] ?? '';
    }

    /**
     * Met à jour le statut en fonction du taux de réalisation
     */
    public function updateStatut(): void
    {
        $taux = $this->taux_realisation;
        $now = now();
        
        if ($taux >= 100) {
            $this->statut = $taux > 110 ? 'depasse' : 'atteint';
        } elseif ($this->mois < $now->month && $this->annee <= $now->year) {
            $this->statut = 'non_atteint';
        } else {
            $this->statut = 'en_cours';
        }
        
        $this->save();
    }

    /**
     * Catégories de recettes par défaut
     */
    public static function getCategoriesRecettes(): array
    {
        return [
            'Facturation clients',
            'Paiements clients',
            'Remboursements reçus',
            'Autres recettes',
        ];
    }

    /**
     * Catégories de dépenses par défaut
     */
    public static function getCategoriesDepenses(): array
    {
        return [
            'Salaires',
            'Loyer',
            'Carburant',
            'Entretien véhicules',
            'Fournitures bureau',
            'Frais bancaires',
            'Impôts et taxes',
            'Remboursement crédit',
            'Primes représentants',
            'Électricité et eau',
            'Télécommunications',
            'Assurances',
            'Autres dépenses',
        ];
    }
}
