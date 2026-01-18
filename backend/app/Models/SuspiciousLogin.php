<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SuspiciousLogin extends Model
{
    protected $fillable = [
        'user_id',
        'ip_address',
        'country_code',
        'country_name',
        'city',
        'region',
        'user_agent',
        'reasons',
        'action_token',
        'token_expires_at',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
        'session_token_id',
    ];

    protected $casts = [
        'reasons' => 'array',
        'token_expires_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    /**
     * Générer un nouveau token d'action sécurisé
     */
    public static function generateActionToken(): string
    {
        return Str::random(64);
    }

    /**
     * Vérifier si le token est encore valide
     */
    public function isTokenValid(): bool
    {
        return $this->status === 'pending' 
            && $this->token_expires_at 
            && $this->token_expires_at->isFuture();
    }

    /**
     * Relation avec l'utilisateur concerné
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec l'admin qui a reviewé
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Approuver cette connexion
     */
    public function approve(?int $reviewerId = null, ?string $notes = null): bool
    {
        if (!$this->isTokenValid()) {
            return false;
        }

        $this->update([
            'status' => 'approved',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ]);

        return true;
    }

    /**
     * Bloquer cette connexion et révoquer la session
     */
    public function block(?int $reviewerId = null, ?string $notes = null): bool
    {
        if (!$this->isTokenValid()) {
            return false;
        }

        $this->update([
            'status' => 'blocked',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ]);

        // Révoquer la session de l'utilisateur si session_token_id est défini
        if ($this->session_token_id) {
            \Laravel\Sanctum\PersonalAccessToken::where('id', $this->session_token_id)->delete();
        }

        return true;
    }

    /**
     * Scope pour les connexions en attente
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending')
            ->where('token_expires_at', '>', now());
    }

    /**
     * Scope pour les connexions récentes
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Obtenir le libellé du statut
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'En attente',
            'approved' => 'Approuvée',
            'blocked' => 'Bloquée',
            default => 'Inconnu',
        };
    }

    /**
     * Obtenir la couleur du statut
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'approved' => 'success',
            'blocked' => 'danger',
            default => 'secondary',
        };
    }
}
