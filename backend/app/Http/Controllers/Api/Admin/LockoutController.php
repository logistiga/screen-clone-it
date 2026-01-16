<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccountLockout;
use App\Models\LoginAttempt;
use App\Models\Audit;
use App\Services\AccountLockoutService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LockoutController extends Controller
{
    public function __construct(
        private AccountLockoutService $lockoutService
    ) {}

    /**
     * Liste des comptes verrouillés
     */
    public function index(): JsonResponse
    {
        $lockouts = AccountLockout::query()
            ->whereNotNull('locked_until')
            ->where('locked_until', '>', now())
            ->orderBy('locked_until', 'desc')
            ->get()
            ->map(function ($lockout) {
                return [
                    'id' => $lockout->id,
                    'email' => $lockout->email,
                    'failed_attempts' => $lockout->failed_attempts,
                    'locked_until' => $lockout->locked_until->toISOString(),
                    'remaining_formatted' => $lockout->getRemainingLockoutFormatted(),
                    'last_failed_attempt' => $lockout->last_failed_attempt?->toISOString(),
                ];
            });

        return response()->json([
            'lockouts' => $lockouts,
            'total' => $lockouts->count(),
        ]);
    }

    /**
     * Historique des tentatives pour un email
     */
    public function attempts(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $limit = $request->input('limit', 50);
        
        $attempts = LoginAttempt::where('email', strtolower($request->email))
            ->orderBy('attempted_at', 'desc')
            ->limit($limit)
            ->get();

        $stats = $this->lockoutService->getAttemptStats($request->email);

        return response()->json([
            'attempts' => $attempts,
            'stats' => $stats,
        ]);
    }

    /**
     * Débloquer un compte manuellement
     */
    public function unlock(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower($request->email);
        $success = $this->lockoutService->unlockAccount($email);

        if (!$success) {
            return response()->json([
                'message' => 'Compte non trouvé ou non verrouillé.',
            ], 404);
        }

        Audit::log('admin_unlock', 'security', "Compte débloqué par admin: {$email}");

        return response()->json([
            'message' => 'Compte débloqué avec succès.',
        ]);
    }

    /**
     * Statistiques globales des verrouillages
     */
    public function stats(): JsonResponse
    {
        $now = now();
        $today = $now->startOfDay();
        $thisWeek = $now->copy()->startOfWeek();
        $thisMonth = $now->copy()->startOfMonth();

        $currentlyLocked = AccountLockout::whereNotNull('locked_until')
            ->where('locked_until', '>', $now)
            ->count();

        $attemptsToday = LoginAttempt::where('attempted_at', '>=', $today)->count();
        $failedToday = LoginAttempt::where('attempted_at', '>=', $today)
            ->where('successful', false)
            ->count();

        $attemptsThisWeek = LoginAttempt::where('attempted_at', '>=', $thisWeek)->count();
        $failedThisWeek = LoginAttempt::where('attempted_at', '>=', $thisWeek)
            ->where('successful', false)
            ->count();

        // Top IPs avec échecs
        $topFailedIps = LoginAttempt::where('successful', false)
            ->where('attempted_at', '>=', $thisWeek)
            ->selectRaw('ip_address, COUNT(*) as count')
            ->groupBy('ip_address')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // Top emails avec échecs
        $topFailedEmails = LoginAttempt::where('successful', false)
            ->where('attempted_at', '>=', $thisWeek)
            ->selectRaw('email, COUNT(*) as count')
            ->groupBy('email')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return response()->json([
            'currently_locked' => $currentlyLocked,
            'today' => [
                'total_attempts' => $attemptsToday,
                'failed_attempts' => $failedToday,
                'success_rate' => $attemptsToday > 0 
                    ? round((($attemptsToday - $failedToday) / $attemptsToday) * 100, 1) 
                    : 100,
            ],
            'this_week' => [
                'total_attempts' => $attemptsThisWeek,
                'failed_attempts' => $failedThisWeek,
                'success_rate' => $attemptsThisWeek > 0 
                    ? round((($attemptsThisWeek - $failedThisWeek) / $attemptsThisWeek) * 100, 1) 
                    : 100,
            ],
            'top_failed_ips' => $topFailedIps,
            'top_failed_emails' => $topFailedEmails,
        ]);
    }

    /**
     * Nettoyer les anciennes données
     */
    public function cleanup(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'nullable|integer|min:7|max:365',
        ]);

        $days = $request->input('days', 30);
        $deleted = $this->lockoutService->cleanupOldAttempts($days);

        Audit::log('cleanup', 'security', "Nettoyage des tentatives: {$deleted} supprimées");

        return response()->json([
            'message' => "Nettoyage terminé.",
            'deleted_attempts' => $deleted,
        ]);
    }
}
