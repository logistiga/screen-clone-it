<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Taxe extends Model
{
    use HasFactory;

    protected $table = 'taxes';

    protected $fillable = [
        'code',
        'nom',
        'taux',
        'description',
        'obligatoire',
        'active',
        'ordre',
    ];

    protected $casts = [
        'taux' => 'float',
        'obligatoire' => 'boolean',
        'active' => 'boolean',
        'ordre' => 'integer',
    ];

    /**
     * Scope pour les taxes actives
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    /**
     * Scope pour les taxes obligatoires
     */
    public function scopeObligatoire(Builder $query): Builder
    {
        return $query->where('obligatoire', true);
    }

    /**
     * Scope pour trier par ordre
     */
    public function scopeOrdonne(Builder $query): Builder
    {
        return $query->orderBy('ordre')->orderBy('id');
    }

    /**
     * Récupérer toutes les taxes actives triées
     */
    public static function getAllActive(): \Illuminate\Database\Eloquent\Collection
    {
        return static::active()->ordonne()->get();
    }

    /**
     * Récupérer une taxe par son code
     */
    public static function getByCode(string $code): ?self
    {
        return static::where('code', strtoupper($code))->first();
    }

    /**
     * Calculer le montant de cette taxe pour un montant HT donné
     */
    public function calculerMontant(float $montantHT): float
    {
        return round($montantHT * ($this->taux / 100), 2);
    }

    /**
     * Vérifier si le code est unique (excluant l'enregistrement courant)
     */
    public static function codeExists(string $code, ?int $excludeId = null): bool
    {
        $query = static::where('code', strtoupper($code));
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        return $query->exists();
    }
}
