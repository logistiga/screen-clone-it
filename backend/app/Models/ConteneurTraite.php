<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConteneurTraite extends Model
{
    use HasFactory;

    protected $table = 'conteneurs_traites';

    protected $fillable = [
        'sortie_id_externe',
        'numero_conteneur',
        'numero_bl',
        'type_conteneur',
        'armateur_code',
        'armateur_nom',
        'client_nom',
        'client_adresse',
        'transitaire_nom',
        'date_sortie',
        'date_retour',
        'camion_id_externe',
        'camion_plaque',
        'remorque_id_externe',
        'remorque_plaque',
        'chauffeur_nom',
        'prime_chauffeur',
        'destination_type',
        'destination_adresse',
        'statut_ops',
        'statut',
        'ordre_travail_id',
        'source_system',
        'synced_at',
        'processed_at',
        'processed_by',
    ];

    protected $casts = [
        'date_sortie' => 'date',
        'date_retour' => 'date',
        'prime_chauffeur' => 'decimal:2',
        'synced_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    // Relations
    public function ordreTravail(): BelongsTo
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_travail_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // Scopes
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    public function scopeAffectes($query)
    {
        return $query->where('statut', 'affecte');
    }

    public function scopeFactures($query)
    {
        return $query->where('statut', 'facture');
    }

    public function scopeNonTraites($query)
    {
        return $query->whereIn('statut', ['en_attente']);
    }

    // Accesseurs
    public function getEstEnAttenteAttribute(): bool
    {
        return $this->statut === 'en_attente';
    }

    public function getEstAffecteAttribute(): bool
    {
        return $this->statut === 'affecte';
    }

    public function getStatutLabelAttribute(): string
    {
        return match ($this->statut) {
            'en_attente' => 'En attente',
            'affecte' => 'Affecté à un OT',
            'facture' => 'Facturé',
            'ignore' => 'Ignoré',
            default => $this->statut,
        };
    }

    // Méthodes
    public function affecter(OrdreTravail $ordre, ?int $userId = null): void
    {
        $this->update([
            'statut' => 'affecte',
            'ordre_travail_id' => $ordre->id,
            'processed_at' => now(),
            'processed_by' => $userId,
        ]);
    }

    public function marquerFacture(): void
    {
        $this->update([
            'statut' => 'facture',
            'processed_at' => now(),
        ]);
    }

    public function ignorer(?int $userId = null): void
    {
        $this->update([
            'statut' => 'ignore',
            'processed_at' => now(),
            'processed_by' => $userId,
        ]);
    }
}
