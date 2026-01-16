<?php

namespace App\Services;

use App\Models\AccountLockout;
use App\Models\LoginAttempt;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AccountLockoutService
{
    /**
     * Nombre maximum de tentatives avant verrouillage
     */
    private const MAX_ATTEMPTS = 5;

    /**
     * Durée du verrouillage en minutes (progression exponentielle)
     */
    private const LOCKOUT_DURATIONS = [
        1 => 5,      // 1er verrouillage: 5 minutes
        2 => 15,     // 2ème verrouillage: 15 minutes
        3 => 30,     // 3ème verrouillage: 30 minutes
        4 => 60,     // 4ème verrouillage: 1 heure
        5 => 1440,   // 5ème+ verrouillage: 24 heures
    ];

    /**
     * Fenêtre de temps pour compter les tentatives (en minutes)
     */
    private const ATTEMPT_WINDOW_MINUTES = 30;

    /**
     * Vérifier si le compte est verrouillé
     */
    public function isLocked(string $email): bool
    {
        $lockout = AccountLockout::where('email', strtolower($email))->first();
        
        if (!$lockout) {
            return false;
        }

        return $lockout->isLocked();
    }

    /**
     * Obtenir les informations de verrouillage
     */
    public function getLockoutInfo(string $email): ?array
    {
        $lockout = AccountLockout::where('email', strtolower($email))->first();
        
        if (!$lockout || !$lockout->isLocked()) {
            return null;
        }

        return [
            'locked' => true,
            'remaining_seconds' => $lockout->getRemainingLockoutSeconds(),
            'remaining_formatted' => $lockout->getRemainingLockoutFormatted(),
            'locked_until' => $lockout->locked_until->toISOString(),
            'failed_attempts' => $lockout->failed_attempts,
        ];
    }

    /**
     * Enregistrer une tentative de connexion échouée
     */
    public function recordFailedAttempt(string $email, Request $request): array
    {
        $email = strtolower($email);

        // Enregistrer la tentative
        LoginAttempt::create([
            'email' => $email,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'successful' => false,
            'attempted_at' => now(),
        ]);

        // Obtenir ou créer l'enregistrement de lockout
        $lockout = AccountLockout::firstOrCreate(
            ['email' => $email],
            ['failed_attempts' => 0]
        );

        // Incrémenter le compteur
        $lockout->increment('failed_attempts');
        $lockout->update(['last_failed_attempt' => now()]);

        // Vérifier si on doit verrouiller
        if ($lockout->failed_attempts >= self::MAX_ATTEMPTS) {
            $this->lockAccount($lockout);
            
            Log::warning('Account locked due to failed attempts', [
                'email' => $email,
                'ip' => $request->ip(),
                'attempts' => $lockout->failed_attempts,
            ]);

            Audit::log('lockout', 'security', "Compte verrouillé après {$lockout->failed_attempts} tentatives", null, [
                'email' => $email,
                'ip_address' => $request->ip(),
            ]);

            return [
                'locked' => true,
                'remaining_seconds' => $lockout->getRemainingLockoutSeconds(),
                'remaining_formatted' => $lockout->getRemainingLockoutFormatted(),
                'attempts' => $lockout->failed_attempts,
            ];
        }

        $remainingAttempts = self::MAX_ATTEMPTS - $lockout->failed_attempts;

        return [
            'locked' => false,
            'failed_attempts' => $lockout->failed_attempts,
            'remaining_attempts' => $remainingAttempts,
            'max_attempts' => self::MAX_ATTEMPTS,
        ];
    }

    /**
     * Enregistrer une connexion réussie
     */
    public function recordSuccessfulLogin(string $email, Request $request): void
    {
        $email = strtolower($email);

        // Enregistrer la tentative réussie
        LoginAttempt::create([
            'email' => $email,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'successful' => true,
            'attempted_at' => now(),
        ]);

        // Réinitialiser le compteur de tentatives échouées
        $lockout = AccountLockout::where('email', $email)->first();
        if ($lockout) {
            $lockout->unlock();
        }
    }

    /**
     * Verrouiller un compte
     */
    private function lockAccount(AccountLockout $lockout): void
    {
        // Calculer combien de fois le compte a été verrouillé
        // basé sur le nombre de tentatives au-delà du seuil
        $lockoutCount = (int) ceil($lockout->failed_attempts / self::MAX_ATTEMPTS);
        $lockoutCount = min($lockoutCount, 5); // Max 5 pour le tableau des durées

        $durationMinutes = self::LOCKOUT_DURATIONS[$lockoutCount] ?? self::LOCKOUT_DURATIONS[5];

        $lockout->update([
            'locked_until' => now()->addMinutes($durationMinutes),
        ]);
    }

    /**
     * Débloquer un compte manuellement (admin)
     */
    public function unlockAccount(string $email): bool
    {
        $lockout = AccountLockout::where('email', strtolower($email))->first();
        
        if (!$lockout) {
            return false;
        }

        $lockout->unlock();

        Audit::log('unlock', 'security', "Compte débloqué manuellement", null, [
            'email' => $email,
        ]);

        return true;
    }

    /**
     * Débloquer via token (self-service par email)
     */
    public function unlockWithToken(string $email, string $token): bool
    {
        $lockout = AccountLockout::where('email', strtolower($email))->first();
        
        if (!$lockout || !$lockout->verifyUnlockToken($token)) {
            return false;
        }

        $lockout->unlock();

        Audit::log('unlock', 'security', "Compte débloqué via token", null, [
            'email' => $email,
        ]);

        return true;
    }

    /**
     * Générer un token de déblocage et retourner l'email
     */
    public function requestUnlockToken(string $email): ?string
    {
        $lockout = AccountLockout::where('email', strtolower($email))->first();
        
        if (!$lockout || !$lockout->isLocked()) {
            return null;
        }

        return $lockout->generateUnlockToken();
    }

    /**
     * Obtenir les statistiques de tentatives pour un email
     */
    public function getAttemptStats(string $email): array
    {
        $email = strtolower($email);
        $since = now()->subMinutes(self::ATTEMPT_WINDOW_MINUTES);

        $recentAttempts = LoginAttempt::where('email', $email)
            ->where('attempted_at', '>=', $since)
            ->get();

        $lockout = AccountLockout::where('email', $email)->first();

        return [
            'recent_attempts' => $recentAttempts->count(),
            'recent_failures' => $recentAttempts->where('successful', false)->count(),
            'recent_successes' => $recentAttempts->where('successful', true)->count(),
            'total_failed_attempts' => $lockout?->failed_attempts ?? 0,
            'is_locked' => $lockout?->isLocked() ?? false,
            'locked_until' => $lockout?->locked_until?->toISOString(),
            'window_minutes' => self::ATTEMPT_WINDOW_MINUTES,
        ];
    }

    /**
     * Nettoyer les anciennes tentatives (à appeler via scheduler)
     */
    public function cleanupOldAttempts(int $daysToKeep = 30): int
    {
        return LoginAttempt::where('attempted_at', '<', now()->subDays($daysToKeep))->delete();
    }
}
