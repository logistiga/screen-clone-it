<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class AccountLockout extends Model
{
    protected $fillable = [
        'email',
        'failed_attempts',
        'locked_until',
        'last_failed_attempt',
        'unlock_token',
        'unlock_token_expires_at',
    ];

    protected $casts = [
        'locked_until' => 'datetime',
        'last_failed_attempt' => 'datetime',
        'unlock_token_expires_at' => 'datetime',
    ];

    /**
     * Vérifie si le compte est actuellement verrouillé
     */
    public function isLocked(): bool
    {
        if (!$this->locked_until) {
            return false;
        }

        // Si le verrouillage a expiré, le débloquer automatiquement
        if ($this->locked_until->isPast()) {
            $this->unlock();
            return false;
        }

        return true;
    }

    /**
     * Retourne le temps restant avant déblocage en secondes
     */
    public function getRemainingLockoutSeconds(): int
    {
        if (!$this->locked_until || $this->locked_until->isPast()) {
            return 0;
        }

        return (int) now()->diffInSeconds($this->locked_until, false);
    }

    /**
     * Retourne le temps restant formaté
     */
    public function getRemainingLockoutFormatted(): string
    {
        $seconds = $this->getRemainingLockoutSeconds();
        
        if ($seconds <= 0) {
            return '0 secondes';
        }

        if ($seconds < 60) {
            return "{$seconds} secondes";
        }

        $minutes = ceil($seconds / 60);
        return "{$minutes} minute" . ($minutes > 1 ? 's' : '');
    }

    /**
     * Débloquer le compte
     */
    public function unlock(): void
    {
        $this->update([
            'failed_attempts' => 0,
            'locked_until' => null,
            'unlock_token' => null,
            'unlock_token_expires_at' => null,
        ]);
    }

    /**
     * Générer un token de déblocage
     */
    public function generateUnlockToken(): string
    {
        $token = bin2hex(random_bytes(32));
        
        $this->update([
            'unlock_token' => hash('sha256', $token),
            'unlock_token_expires_at' => now()->addHours(1),
        ]);

        return $token;
    }

    /**
     * Vérifier un token de déblocage
     */
    public function verifyUnlockToken(string $token): bool
    {
        if (!$this->unlock_token || !$this->unlock_token_expires_at) {
            return false;
        }

        if ($this->unlock_token_expires_at->isPast()) {
            return false;
        }

        return hash_equals($this->unlock_token, hash('sha256', $token));
    }
}
