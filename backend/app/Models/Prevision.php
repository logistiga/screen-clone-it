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
        'source',
        'categorie',
        'description',
        'montant_prevu',
        'montant_realise',
        'mois',
        'annee',
        'date_prevue',
        'statut',
        'notes',
        'user_id',
        'banque_id',
    ];

    protected $casts = [
        'montant_prevu' => 'decimal:2',
        'montant_realise' => 'decimal:2',
        'mois' => 'integer',
        'annee' => 'integer',
        'date_prevue' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function banque(): BelongsTo
    {
        return $this->belongsTo(Banque::class);
    }

    public function getEcartAttribute(): float
    {
        return $this->montant_realise - $this->montant_prevu;
    }

    public function getTauxRealisationAttribute(): float
    {
        if ($this->montant_prevu == 0) return 0;
        return round(($this->montant_realise / $this->montant_prevu) * 100, 2);
    }

    public function updateStatut(): void
    {
        $taux = $this->taux_realisation;
        
        if ($taux >= 100) {
            $this->statut = $taux > 110 ? 'depasse' : 'atteint';
        } elseif ($this->mois < now()->month && $this->annee <= now()->year) {
            $this->statut = 'non_atteint';
        } else {
            $this->statut = 'en_cours';
        }
        
        $this->save();
    }

    public static function getCategoriesRecettes(): array
    {
        return [
            'Facturation clients',
            'Paiements clients',
            'Remboursements reçus',
            'Autres recettes',
        ];
    }

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
