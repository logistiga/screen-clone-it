<?php

namespace App\Services\Notification;

use App\Models\Setting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

/**
 * Configuration SMTP dynamique partagée entre les services de notification
 */
trait MailConfigTrait
{
    private function configureMailer(): array
    {
        $smtpHost = Setting::get('mail.smtp_host');
        $smtpPort = Setting::get('mail.smtp_port');
        $smtpUser = Setting::get('mail.smtp_user');
        $smtpPassword = Setting::get('mail.smtp_password');
        $ssl = Setting::get('mail.ssl', true);
        $fromName = Setting::get('mail.from_name', 'Logistiga');
        $fromEmail = Setting::get('mail.from_address', 'contact@logistiga.com');
        $signature = Setting::get('mail.signature', '');

        Log::debug('Configuration SMTP chargée', [
            'host' => $smtpHost, 'port' => $smtpPort, 'user' => $smtpUser,
            'password_set' => !empty($smtpPassword), 'ssl' => $ssl,
            'from_email' => $fromEmail, 'from_name' => $fromName,
        ]);

        if ($smtpHost && $smtpPort && $smtpUser && $smtpPassword) {
            Config::set('mail.mailers.smtp.host', $smtpHost);
            Config::set('mail.mailers.smtp.port', (int) $smtpPort);
            Config::set('mail.mailers.smtp.username', $smtpUser);
            Config::set('mail.mailers.smtp.password', $smtpPassword);
            Config::set('mail.mailers.smtp.encryption', $ssl ? 'tls' : null);
            Config::set('mail.from.address', $fromEmail);
            Config::set('mail.from.name', $fromName);
            Log::info('Mailer SMTP configuré dynamiquement depuis la base de données');
        } else {
            Log::warning('Configuration SMTP incomplète, utilisation des valeurs par défaut');
        }

        return ['from_name' => $fromName, 'from_email' => $fromEmail, 'signature' => $signature];
    }
}
