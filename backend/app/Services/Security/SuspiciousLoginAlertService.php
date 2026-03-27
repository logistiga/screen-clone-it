<?php

namespace App\Services\Security;

use App\Models\SuspiciousLogin;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Envoi des alertes email pour connexions suspectes (HTML template + envoi)
 */
class SuspiciousLoginAlertService
{
    private const ADMIN_EMAIL = 'omar@logistiga.com';

    public function sendAdminAlert(User $user, array $analysis, SuspiciousLogin $suspiciousLogin): void
    {
        $mailConfig = $this->getMailConfig();
        $location = $this->formatLocation($analysis);
        $timestamp = now()->format('d/m/Y à H:i:s');
        
        $frontendUrl = env('FRONTEND_URL', 'https://facturation.logistiga.pro');
        $approveUrl = "{$frontendUrl}/security/{$suspiciousLogin->action_token}/approve";
        $blockUrl = "{$frontendUrl}/security/{$suspiciousLogin->action_token}/block";

        $subject = "🔔 Alerte sécurité: Connexion suspecte - {$user->nom}";
        
        $htmlContent = $this->buildAlertHtml($user, $analysis, $timestamp, $location, $approveUrl, $blockUrl, $suspiciousLogin);

        Mail::send([], [], function ($mail) use ($subject, $htmlContent, $mailConfig) {
            $mail->to(self::ADMIN_EMAIL)
                ->subject($subject)
                ->html($htmlContent)
                ->from($mailConfig['from_email'], $mailConfig['from_name']);
        });

        Log::info('Alerte de connexion suspecte envoyée à l\'admin', [
            'admin_email' => self::ADMIN_EMAIL,
            'suspicious_login_id' => $suspiciousLogin->id,
        ]);
    }

    private function buildAlertHtml(User $user, array $analysis, string $timestamp, string $location, string $approveUrl, string $blockUrl, SuspiciousLogin $suspiciousLogin): string
    {
        $reasonsHtml = implode('', array_map(fn($r) => "<li>{$r}</li>", $analysis['reasons']));

        return "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background: #dc2626; color: white; padding: 15px 20px; border-radius: 8px 8px 0 0;'>
                    <h2 style='margin: 0;'>⚠️ Alerte de sécurité</h2>
                </div>
                <div style='background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 0 0 8px 8px;'>
                    <p style='margin-top: 0;'>Une connexion suspecte a été détectée sur le compte suivant :</p>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr><td style='padding: 8px 0; font-weight: bold; width: 140px;'>Utilisateur :</td><td style='padding: 8px 0;'>{$user->nom} ({$user->email})</td></tr>
                        <tr><td style='padding: 8px 0; font-weight: bold;'>Date/Heure :</td><td style='padding: 8px 0;'>{$timestamp}</td></tr>
                        <tr><td style='padding: 8px 0; font-weight: bold;'>Adresse IP :</td><td style='padding: 8px 0;'>{$analysis['ip_address']}</td></tr>
                        <tr><td style='padding: 8px 0; font-weight: bold;'>Localisation :</td><td style='padding: 8px 0;'>{$location}</td></tr>
                    </table>
                    <div style='background: #fee2e2; padding: 15px; border-radius: 6px; margin-top: 15px;'>
                        <strong>Raisons de l'alerte :</strong>
                        <ul style='margin: 10px 0 0 0; padding-left: 20px;'>{$reasonsHtml}</ul>
                    </div>
                    <div style='margin-top: 25px; text-align: center;'>
                        <p style='font-weight: bold; margin-bottom: 15px;'>Que souhaitez-vous faire ?</p>
                        <table style='width: 100%; border-collapse: separate; border-spacing: 10px;'>
                            <tr>
                                <td style='width: 50%; text-align: center;'>
                                    <a href='{$approveUrl}' style='display: inline-block; padding: 15px 30px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);'>✅ Autoriser</a>
                                    <p style='margin: 8px 0 0 0; font-size: 12px; color: #666;'>La connexion est légitime</p>
                                </td>
                                <td style='width: 50%; text-align: center;'>
                                    <a href='{$blockUrl}' style='display: inline-block; padding: 15px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);'>🚫 Bloquer</a>
                                    <p style='margin: 8px 0 0 0; font-size: 12px; color: #666;'>Révoquer la session immédiatement</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div style='margin-top: 20px; padding: 12px; background: #fff3cd; border-radius: 6px; font-size: 13px;'>
                        <strong>⏰ Important :</strong> Ce lien expire dans 48 heures. Si vous ne faites rien, la session restera active.
                    </div>
                </div>
                <p style='color: #666; font-size: 12px; margin-top: 20px; text-align: center;'>
                    Cet email a été envoyé automatiquement par le système de sécurité de Logistiga.<br>ID de référence : #{$suspiciousLogin->id}
                </p>
            </div>
        </body>
        </html>";
    }

    private function formatLocation(array $analysis): string
    {
        $parts = array_filter([
            $analysis['city'] ?? null,
            $analysis['region'] ?? null,
            $analysis['country_name'] ?? null,
        ]);
        return !empty($parts) ? implode(', ', $parts) : 'Localisation inconnue';
    }

    private function getMailConfig(): array
    {
        return [
            'from_email' => config('mail.from.address', 'contact@logistiga.com'),
            'from_name' => config('mail.from.name', 'Logistiga Sécurité'),
        ];
    }
}
