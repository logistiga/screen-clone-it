<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConteneurAnomalie extends Model
{
    use HasFactory;

    protected $table = 'conteneurs_anomalies';

    protected $fillable = [
        'type',
        'numero_conteneur',
        'numero_bl',
        'client_nom',
        'ordre_travail_id',
        'details',
        'statut',
        'traite_par',
        'traite_at',
        'detected_at',
    ];

    protected $casts = [
        'details' => 'array',
        'traite_at' => 'datetime',
        'detected_at' => 'datetime',
    ];

    // ===== RELATIONS =====

    public function ordreTravail(): BelongsTo
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_travail_id');
    }

    public function traitePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traite_par');
    }

    // ===== SCOPES =====

    public function scopeNonTraitees($query)
    {
        return $query->where('statut', 'non_traite');
    }

    public function scopeOublies($query)
    {
        return $query->where('type', 'oublie');
    }

    public function scopeDoublons($query)
    {
        return $query->where('type', 'doublon');
    }

    // ===== METHODS =====

    /**
     * Marquer l'anomalie comme traitée
     */
    public function traiter(?int $userId = null): void
    {
        $this->update([
            'statut' => 'traite',
            'traite_par' => $userId,
            'traite_at' => now(),
        ]);
    }

    /**
     * Ignorer l'anomalie
     */
    public function ignorer(?int $userId = null): void
    {
        $this->update([
            'statut' => 'ignore',
            'traite_par' => $userId,
            'traite_at' => now(),
        ]);
    }

    /**
     * Obtenir les conteneurs manquants depuis les détails
     */
    public function getConteneurManquantsAttribute(): array
    {
        return $this->details['manquants'] ?? [];
    }

    /**
     * Obtenir le nombre de conteneurs manquants
     */
    public function getNombreManquantsAttribute(): int
    {
        return count($this->conteneur_manquants);
    }
}
