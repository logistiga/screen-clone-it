<?php

namespace App\Services;

use App\Models\LoginAttempt;
use App\Models\SuspiciousLogin;
use App\Models\User;
use App\Services\Security\SuspiciousLoginAlertService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

/**
 * Détection de connexions suspectes — alertes email déléguées à SuspiciousLoginAlertService
 */
class SuspiciousLoginDetector
{
    private const ALLOWED_COUNTRIES = ['GA'];
    private const GEO_CACHE_TTL = 86400;
    private const ACTION_TOKEN_TTL_HOURS = 48;

    protected SuspiciousLoginAlertService $alertService;

    public function __construct()
    {
        $this->alertService = new SuspiciousLoginAlertService();
    }

    public function analyzeLogin(User $user, string $ipAddress, string $userAgent): array
    {
        $analysis = [
            'is_suspicious' => false, 'reasons' => [], 'ip_address' => $ipAddress,
            'country' => null, 'city' => null, 'is_new_ip' => false,
            'is_foreign_country' => false, 'is_mobile' => false,
        ];

        $isMobile = $this->isMobileDevice($userAgent);
        $analysis['is_mobile'] = $isMobile;

        if ($this->isLocalIp($ipAddress)) {
            if ($isMobile) { $analysis['is_suspicious'] = true; $analysis['reasons'][] = "Connexion depuis un appareil mobile"; }
            return $analysis;
        }

        if ($isMobile) { $analysis['is_suspicious'] = true; $analysis['reasons'][] = "Connexion depuis un appareil mobile"; }

        $isNewIp = $this->isNewIpForUser($user, $ipAddress);
        $analysis['is_new_ip'] = $isNewIp;

        $geoData = $this->getGeoLocation($ipAddress);
        if ($geoData) {
            $analysis['country'] = $geoData['country'];
            $analysis['country_name'] = $geoData['country_name'];
            $analysis['city'] = $geoData['city'];
            $analysis['region'] = $geoData['region'];

            if (!in_array($geoData['country'], self::ALLOWED_COUNTRIES)) {
                $analysis['is_foreign_country'] = true;
                $analysis['is_suspicious'] = true;
                if (!in_array("Connexion depuis {$geoData['country_name']} (hors Gabon)", $analysis['reasons'])) {
                    $analysis['reasons'][] = "Connexion depuis {$geoData['country_name']} (hors Gabon)";
                }
            }
        }

        if ($isNewIp && !$analysis['is_foreign_country'] && !$isMobile) {
            if (!$this->hasRecentSuccessfulLogin($user, $ipAddress, 30)) {
                $analysis['is_suspicious'] = true;
                $analysis['reasons'][] = "Nouvelle adresse IP détectée";
            }
        }

        return $analysis;
    }

    public function sendAlertIfSuspicious(User $user, array $analysis, ?int $sessionTokenId = null): ?SuspiciousLogin
    {
        if (!$analysis['is_suspicious']) return null;

        try {
            $suspiciousLogin = $this->createSuspiciousLoginRecord($user, $analysis, $sessionTokenId);
            $this->alertService->sendAdminAlert($user, $analysis, $suspiciousLogin);

            Log::warning('Connexion suspecte détectée', [
                'user_id' => $user->id, 'ip' => $analysis['ip_address'],
                'country' => $analysis['country'] ?? 'inconnu', 'reasons' => $analysis['reasons'],
            ]);

            return $suspiciousLogin;
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de l\'alerte de connexion suspecte', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function isMobileDevice(string $userAgent): bool
    {
        $patterns = ['/Mobile/i', '/Android/i', '/iPhone/i', '/iPad/i', '/iPod/i', '/Windows Phone/i', '/BlackBerry/i', '/Opera Mini/i', '/Opera Mobi/i', '/IEMobile/i', '/webOS/i', '/Fennec/i', '/Kindle/i', '/Silk/i', '/UC Browser/i', '/Samsung/i', '/HTC/i', '/LG/i', '/Huawei/i', '/Xiaomi/i'];
        foreach ($patterns as $pattern) { if (preg_match($pattern, $userAgent)) return true; }
        return false;
    }

    private function createSuspiciousLoginRecord(User $user, array $analysis, ?int $sessionTokenId = null): SuspiciousLogin
    {
        return SuspiciousLogin::create([
            'user_id' => $user->id, 'ip_address' => $analysis['ip_address'],
            'country_code' => $analysis['country'] ?? null, 'country_name' => $analysis['country_name'] ?? null,
            'city' => $analysis['city'] ?? null, 'region' => $analysis['region'] ?? null,
            'user_agent' => request()->userAgent(), 'reasons' => $analysis['reasons'],
            'action_token' => SuspiciousLogin::generateActionToken(),
            'token_expires_at' => now()->addHours(self::ACTION_TOKEN_TTL_HOURS),
            'status' => 'pending', 'session_token_id' => $sessionTokenId,
        ]);
    }

    private function isNewIpForUser(User $user, string $ipAddress): bool
    {
        return !LoginAttempt::where('email', strtolower($user->email))
            ->where('ip_address', $ipAddress)->where('successful', true)
            ->where('attempted_at', '>=', now()->subDays(90))->exists();
    }

    private function hasRecentSuccessfulLogin(User $user, string $ipAddress, int $days = 30): bool
    {
        return LoginAttempt::where('email', strtolower($user->email))
            ->where('ip_address', $ipAddress)->where('successful', true)
            ->where('attempted_at', '>=', now()->subDays($days))->exists();
    }

    private function getGeoLocation(string $ipAddress): ?array
    {
        return Cache::remember("geo_ip_{$ipAddress}", self::GEO_CACHE_TTL, function () use ($ipAddress) {
            try {
                $response = Http::timeout(5)->get("http://ip-api.com/json/{$ipAddress}", ['fields' => 'status,country,countryCode,regionName,city']);
                if ($response->successful()) {
                    $data = $response->json();
                    if ($data['status'] === 'success') {
                        return ['country' => $data['countryCode'] ?? null, 'country_name' => $data['country'] ?? null, 'region' => $data['regionName'] ?? null, 'city' => $data['city'] ?? null];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Erreur géolocalisation IP', ['ip' => $ipAddress, 'error' => $e->getMessage()]);
            }
            return null;
        });
    }

    private function isLocalIp(string $ip): bool
    {
        $patterns = ['/^127\./', '/^10\./', '/^172\.(1[6-9]|2[0-9]|3[01])\./', '/^192\.168\./', '/^::1$/', '/^fc00:/i', '/^fe80:/i'];
        foreach ($patterns as $pattern) { if (preg_match($pattern, $ip)) return true; }
        return false;
    }
}
