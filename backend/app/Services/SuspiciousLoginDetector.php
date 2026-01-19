<?php

namespace App\Services;

use App\Models\LoginAttempt;
use App\Models\SuspiciousLogin;
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
    
    // Durée de validité du token d'action (48h)
    private const ACTION_TOKEN_TTL_HOURS = 48;

    /**
     * Analyser une connexion et détecter si elle est suspecte
     */
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
            'is_mobile' => false,
        ];

        // Détecter si c'est un appareil mobile
        $isMobile = $this->isMobileDevice($userAgent);
        $analysis['is_mobile'] = $isMobile;

        // Skip pour les IPs locales/développement
        if ($this->isLocalIp($ipAddress)) {
            Log::debug('SuspiciousLoginDetector: IP locale ignorée', ['ip' => $ipAddress]);
            
            // Même pour les IPs locales, signaler les connexions mobiles
            if ($isMobile) {
                $analysis['is_suspicious'] = true;
                $analysis['reasons'][] = "Connexion depuis un appareil mobile";
            }
            
            return $analysis;
        }

        // 1. Vérifier si c'est un appareil mobile
        if ($isMobile) {
            $analysis['is_suspicious'] = true;
            $analysis['reasons'][] = "Connexion depuis un appareil mobile";
        }

        // 2. Vérifier si c'est une nouvelle IP pour cet utilisateur
        $isNewIp = $this->isNewIpForUser($user, $ipAddress);
        $analysis['is_new_ip'] = $isNewIp;

        // 3. Obtenir la géolocalisation
        $geoData = $this->getGeoLocation($ipAddress);
        if ($geoData) {
            $analysis['country'] = $geoData['country'];
            $analysis['country_name'] = $geoData['country_name'];
            $analysis['city'] = $geoData['city'];
            $analysis['region'] = $geoData['region'];

            // 4. Vérifier si le pays est autorisé
            if (!in_array($geoData['country'], self::ALLOWED_COUNTRIES)) {
                $analysis['is_foreign_country'] = true;
                $analysis['is_suspicious'] = true;
                if (!in_array("Connexion depuis {$geoData['country_name']} (hors Gabon)", $analysis['reasons'])) {
                    $analysis['reasons'][] = "Connexion depuis {$geoData['country_name']} (hors Gabon)";
                }
            }
        }

        // 5. Si nouvelle IP ET pas déjà signalé pour d'autres raisons
        if ($isNewIp && !$analysis['is_foreign_country'] && !$isMobile) {
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
     * Détecter si le User-Agent correspond à un appareil mobile
     */
    private function isMobileDevice(string $userAgent): bool
    {
        $mobilePatterns = [
            '/Mobile/i',
            '/Android/i',
            '/iPhone/i',
            '/iPad/i',
            '/iPod/i',
            '/Windows Phone/i',
            '/BlackBerry/i',
            '/Opera Mini/i',
            '/Opera Mobi/i',
            '/IEMobile/i',
            '/webOS/i',
            '/Fennec/i',
            '/Kindle/i',
            '/Silk/i',
            '/UC Browser/i',
            '/Samsung/i',
            '/HTC/i',
            '/LG/i',
            '/Huawei/i',
            '/Xiaomi/i',
        ];

        foreach ($mobilePatterns as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Envoyer une alerte email à l'admin si la connexion est suspecte
     * @param int|null $sessionTokenId ID du token de session pour pouvoir le révoquer
     * @return SuspiciousLogin|null L'enregistrement créé ou null si pas suspect
     */
    public function sendAlertIfSuspicious(User $user, array $analysis, ?int $sessionTokenId = null): ?SuspiciousLogin
    {
        if (!$analysis['is_suspicious']) {
            return null;
        }

        try {
            // Créer un enregistrement de connexion suspecte avec token d'action
            $suspiciousLogin = $this->createSuspiciousLoginRecord($user, $analysis, $sessionTokenId);
            
            // Envoyer l'alerte avec les boutons d'action
            $this->sendAdminAlert($user, $analysis, $suspiciousLogin);
            
            Log::warning('Connexion suspecte détectée', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'ip' => $analysis['ip_address'],
                'country' => $analysis['country'] ?? 'inconnu',
                'reasons' => $analysis['reasons'],
                'suspicious_login_id' => $suspiciousLogin->id,
            ]);

            return $suspiciousLogin;
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de l\'alerte de connexion suspecte', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
            return null;
        }
    }

    /**
     * Créer un enregistrement de connexion suspecte
     */
    private function createSuspiciousLoginRecord(User $user, array $analysis, ?int $sessionTokenId = null): SuspiciousLogin
    {
        return SuspiciousLogin::create([
            'user_id' => $user->id,
            'ip_address' => $analysis['ip_address'],
            'country_code' => $analysis['country'] ?? null,
            'country_name' => $analysis['country_name'] ?? null,
            'city' => $analysis['city'] ?? null,
            'region' => $analysis['region'] ?? null,
            'user_agent' => request()->userAgent(),
            'reasons' => $analysis['reasons'],
            'action_token' => SuspiciousLogin::generateActionToken(),
            'token_expires_at' => now()->addHours(self::ACTION_TOKEN_TTL_HOURS),
            'status' => 'pending',
            'session_token_id' => $sessionTokenId,
        ]);
    }

    /**
     * Envoyer l'email d'alerte à l'administrateur avec boutons d'action
     */
    private function sendAdminAlert(User $user, array $analysis, SuspiciousLogin $suspiciousLogin): void
    {
        $mailConfig = $this->getMailConfig();
        
        $location = $this->formatLocation($analysis);
        $timestamp = now()->format('d/m/Y à H:i:s');
        
        // Générer les URLs d'action
        $baseUrl = config('app.url');
        $approveUrl = "{$baseUrl}/api/security/suspicious-login/{$suspiciousLogin->action_token}/approve";
        $blockUrl = "{$baseUrl}/api/security/suspicious-login/{$suspiciousLogin->action_token}/block";

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
                    
                    <!-- BOUTONS D'ACTION -->
                    <div style='margin-top: 25px; text-align: center;'>
                        <p style='font-weight: bold; margin-bottom: 15px;'>Que souhaitez-vous faire ?</p>
                        
                        <table style='width: 100%; border-collapse: separate; border-spacing: 10px;'>
                            <tr>
                                <td style='width: 50%; text-align: center;'>
                                    <a href='{$approveUrl}' 
                                       style='display: inline-block; padding: 15px 30px; background: #16a34a; color: white; 
                                              text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.2);'>
                                        ✅ Autoriser
                                    </a>
                                    <p style='margin: 8px 0 0 0; font-size: 12px; color: #666;'>
                                        La connexion est légitime
                                    </p>
                                </td>
                                <td style='width: 50%; text-align: center;'>
                                    <a href='{$blockUrl}' 
                                       style='display: inline-block; padding: 15px 30px; background: #dc2626; color: white; 
                                              text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.2);'>
                                        🚫 Bloquer
                                    </a>
                                    <p style='margin: 8px 0 0 0; font-size: 12px; color: #666;'>
                                        Révoquer la session immédiatement
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style='margin-top: 20px; padding: 12px; background: #fff3cd; border-radius: 6px; font-size: 13px;'>
                        <strong>⏰ Important :</strong> Ce lien expire dans 48 heures. 
                        Si vous ne faites rien, la session restera active.
                    </div>
                </div>
                
                <p style='color: #666; font-size: 12px; margin-top: 20px; text-align: center;'>
                    Cet email a été envoyé automatiquement par le système de sécurité de Logistiga.<br>
                    ID de référence : #{$suspiciousLogin->id}
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
            'suspicious_login_id' => $suspiciousLogin->id,
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
