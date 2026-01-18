<?php

namespace App\Services;

use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class SuspiciousLoginDetector
{
    // Email admin pour les alertes
    private const ADMIN_EMAIL = 'omar@logistiga.com';
    
    // Pays autorisés (codes ISO)
    private const ALLOWED_COUNTRIES = ['GA']; // Gabon uniquement
    
    // Durée de cache pour la géolocalisation (24h)
    private const GEO_CACHE_TTL = 86400;

    /**
     * Analyser une connexion et détecter si elle est suspecte
     */
    public function analyzeLogin(User $user, string $ipAddress, string $userAgent): array
    {
        $analysis = [
            'is_suspicious' => false,
            'reasons' => [],
            'ip_address' => $ipAddress,
            'country' => null,
            'city' => null,
            'is_new_ip' => false,
            'is_foreign_country' => false,
        ];

        // Skip pour les IPs locales/développement
        if ($this->isLocalIp($ipAddress)) {
            Log::debug('SuspiciousLoginDetector: IP locale ignorée', ['ip' => $ipAddress]);
            return $analysis;
        }

        // 1. Vérifier si c'est une nouvelle IP pour cet utilisateur
        $isNewIp = $this->isNewIpForUser($user, $ipAddress);
        $analysis['is_new_ip'] = $isNewIp;

        // 2. Obtenir la géolocalisation
        $geoData = $this->getGeoLocation($ipAddress);
        if ($geoData) {
            $analysis['country'] = $geoData['country'];
            $analysis['country_name'] = $geoData['country_name'];
            $analysis['city'] = $geoData['city'];
            $analysis['region'] = $geoData['region'];

            // 3. Vérifier si le pays est autorisé
            if (!in_array($geoData['country'], self::ALLOWED_COUNTRIES)) {
                $analysis['is_foreign_country'] = true;
                $analysis['is_suspicious'] = true;
                $analysis['reasons'][] = "Connexion depuis {$geoData['country_name']} (hors Gabon)";
            }
        }

        // 4. Si nouvelle IP ET pas déjà signalé comme pays étranger
        if ($isNewIp && !$analysis['is_foreign_country']) {
            // Vérifier s'il y a eu des connexions récentes depuis cette IP
            $recentFromThisIp = $this->hasRecentSuccessfulLogin($user, $ipAddress, 30);
            
            if (!$recentFromThisIp) {
                $analysis['is_suspicious'] = true;
                $analysis['reasons'][] = "Nouvelle adresse IP détectée";
            }
        }

        return $analysis;
    }

    /**
     * Envoyer une alerte email à l'admin si la connexion est suspecte
     */
    public function sendAlertIfSuspicious(User $user, array $analysis): bool
    {
        if (!$analysis['is_suspicious']) {
            return false;
        }

        try {
            $this->sendAdminAlert($user, $analysis);
            
            Log::warning('Connexion suspecte détectée', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'ip' => $analysis['ip_address'],
                'country' => $analysis['country'] ?? 'inconnu',
                'reasons' => $analysis['reasons'],
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de l\'alerte de connexion suspecte', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
            return false;
        }
    }

    /**
     * Envoyer l'email d'alerte à l'administrateur
     */
    private function sendAdminAlert(User $user, array $analysis): void
    {
        $mailConfig = $this->getMailConfig();
        
        $location = $this->formatLocation($analysis);
        $reasons = implode("\n• ", $analysis['reasons']);
        $timestamp = now()->format('d/m/Y à H:i:s');

        $subject = "🔔 Alerte sécurité: Connexion suspecte - {$user->nom}";
        
        $htmlContent = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background: #dc2626; color: white; padding: 15px 20px; border-radius: 8px 8px 0 0;'>
                    <h2 style='margin: 0;'>⚠️ Alerte de sécurité</h2>
                </div>
                
                <div style='background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 0 0 8px 8px;'>
                    <p style='margin-top: 0;'>Une connexion suspecte a été détectée sur le compte suivant :</p>
                    
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr>
                            <td style='padding: 8px 0; font-weight: bold; width: 140px;'>Utilisateur :</td>
                            <td style='padding: 8px 0;'>{$user->nom} ({$user->email})</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; font-weight: bold;'>Date/Heure :</td>
                            <td style='padding: 8px 0;'>{$timestamp}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; font-weight: bold;'>Adresse IP :</td>
                            <td style='padding: 8px 0;'>{$analysis['ip_address']}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; font-weight: bold;'>Localisation :</td>
                            <td style='padding: 8px 0;'>{$location}</td>
                        </tr>
                    </table>
                    
                    <div style='background: #fee2e2; padding: 15px; border-radius: 6px; margin-top: 15px;'>
                        <strong>Raisons de l'alerte :</strong>
                        <ul style='margin: 10px 0 0 0; padding-left: 20px;'>
                            " . implode('', array_map(fn($r) => "<li>{$r}</li>", $analysis['reasons'])) . "
                        </ul>
                    </div>
                    
                    <div style='margin-top: 20px; padding: 15px; background: #fff; border-radius: 6px; border: 1px solid #e5e5e5;'>
                        <strong>Actions recommandées :</strong>
                        <ol style='margin: 10px 0 0 0; padding-left: 20px;'>
                            <li>Vérifiez si cette connexion est légitime avec l'utilisateur</li>
                            <li>Si non autorisée, révoquez les sessions de cet utilisateur</li>
                            <li>Envisagez de réinitialiser le mot de passe du compte</li>
                        </ol>
                    </div>
                </div>
                
                <p style='color: #666; font-size: 12px; margin-top: 20px; text-align: center;'>
                    Cet email a été envoyé automatiquement par le système de sécurité de Logistiga.
                </p>
            </div>
        </body>
        </html>";

        Mail::send([], [], function ($mail) use ($subject, $htmlContent, $mailConfig) {
            $mail->to(self::ADMIN_EMAIL)
                ->subject($subject)
                ->html($htmlContent)
                ->from($mailConfig['from_email'], $mailConfig['from_name']);
        });

        Log::info('Alerte de connexion suspecte envoyée à l\'admin', [
            'admin_email' => self::ADMIN_EMAIL,
            'subject' => $subject,
        ]);
    }

    /**
     * Vérifier si c'est une nouvelle IP pour cet utilisateur
     */
    private function isNewIpForUser(User $user, string $ipAddress): bool
    {
        // Rechercher dans les connexions réussies des 90 derniers jours
        $existingLogin = LoginAttempt::where('email', strtolower($user->email))
            ->where('ip_address', $ipAddress)
            ->where('successful', true)
            ->where('attempted_at', '>=', now()->subDays(90))
            ->exists();

        return !$existingLogin;
    }

    /**
     * Vérifier s'il y a eu des connexions récentes depuis cette IP
     */
    private function hasRecentSuccessfulLogin(User $user, string $ipAddress, int $days = 30): bool
    {
        return LoginAttempt::where('email', strtolower($user->email))
            ->where('ip_address', $ipAddress)
            ->where('successful', true)
            ->where('attempted_at', '>=', now()->subDays($days))
            ->exists();
    }

    /**
     * Obtenir la géolocalisation d'une IP
     */
    private function getGeoLocation(string $ipAddress): ?array
    {
        $cacheKey = "geo_ip_{$ipAddress}";
        
        return Cache::remember($cacheKey, self::GEO_CACHE_TTL, function () use ($ipAddress) {
            try {
                // Utiliser ip-api.com (gratuit, pas de clé API requise)
                $response = Http::timeout(5)->get("http://ip-api.com/json/{$ipAddress}", [
                    'fields' => 'status,country,countryCode,regionName,city',
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    
                    if ($data['status'] === 'success') {
                        return [
                            'country' => $data['countryCode'] ?? null,
                            'country_name' => $data['country'] ?? null,
                            'region' => $data['regionName'] ?? null,
                            'city' => $data['city'] ?? null,
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Erreur géolocalisation IP', [
                    'ip' => $ipAddress,
                    'error' => $e->getMessage(),
                ]);
            }

            return null;
        });
    }

    /**
     * Vérifier si c'est une IP locale/privée
     */
    private function isLocalIp(string $ip): bool
    {
        // IPs locales et privées
        $localPatterns = [
            '/^127\./',           // localhost
            '/^10\./',            // Classe A privée
            '/^172\.(1[6-9]|2[0-9]|3[01])\./', // Classe B privée
            '/^192\.168\./',      // Classe C privée
            '/^::1$/',            // IPv6 localhost
            '/^fc00:/i',          // IPv6 privée
            '/^fe80:/i',          // IPv6 link-local
        ];

        foreach ($localPatterns as $pattern) {
            if (preg_match($pattern, $ip)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Formater la localisation pour l'affichage
     */
    private function formatLocation(array $analysis): string
    {
        $parts = [];
        
        if (!empty($analysis['city'])) {
            $parts[] = $analysis['city'];
        }
        if (!empty($analysis['region'])) {
            $parts[] = $analysis['region'];
        }
        if (!empty($analysis['country_name'])) {
            $parts[] = $analysis['country_name'];
        }

        return !empty($parts) ? implode(', ', $parts) : 'Localisation inconnue';
    }

    /**
     * Obtenir la configuration mail
     */
    private function getMailConfig(): array
    {
        return [
            'from_email' => config('mail.from.address', 'contact@logistiga.com'),
            'from_name' => config('mail.from.name', 'Logistiga Sécurité'),
        ];
    }
}
