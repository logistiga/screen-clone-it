<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

class EmailConfigController extends Controller
{
    /**
     * Obtenir la configuration email
     */
    public function index(): JsonResponse
    {
        $config = [
            'smtp_host' => $this->getSetting('mail.smtp_host', config('mail.mailers.smtp.host')),
            'smtp_port' => $this->getSetting('mail.smtp_port', config('mail.mailers.smtp.port')),
            'smtp_user' => $this->getSetting('mail.smtp_user', config('mail.mailers.smtp.username')),
            'smtp_password' => $this->getSetting('mail.smtp_password') ? '********' : '',
            'expediteur_nom' => $this->getSetting('mail.from_name', config('mail.from.name')),
            'expediteur_email' => $this->getSetting('mail.from_address', config('mail.from.address')),
            'reply_to' => $this->getSetting('mail.reply_to', config('mail.reply_to.address')),
            'signature' => $this->getSetting('mail.signature', "L'équipe LOJISTIGA\nTél: +221 XX XXX XX XX\nEmail: contact@lojistiga.com"),
            'copie_archive' => $this->getSetting('mail.archive_address', config('mail.archive.address')),
            'ssl' => $this->getSetting('mail.ssl', true),
        ];

        return response()->json($config);
    }

    /**
     * Mettre à jour la configuration email
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'smtp_host' => 'nullable|string|max:255',
            'smtp_port' => 'nullable|string|max:10',
            'smtp_user' => 'nullable|string|max:255',
            'smtp_password' => 'nullable|string|max:255',
            'expediteur_nom' => 'nullable|string|max:255',
            'expediteur_email' => 'nullable|email|max:255',
            'reply_to' => 'nullable|email|max:255',
            'signature' => 'nullable|string|max:1000',
            'copie_archive' => 'nullable|email|max:255',
            'ssl' => 'boolean',
        ]);

        // Sauvegarder les paramètres
        if (isset($validated['smtp_host'])) {
            $this->setSetting('mail.smtp_host', $validated['smtp_host']);
        }
        if (isset($validated['smtp_port'])) {
            $this->setSetting('mail.smtp_port', $validated['smtp_port']);
        }
        if (isset($validated['smtp_user'])) {
            $this->setSetting('mail.smtp_user', $validated['smtp_user']);
        }
        if (isset($validated['smtp_password']) && $validated['smtp_password'] !== '********') {
            $this->setSetting('mail.smtp_password', encrypt($validated['smtp_password']), 'encrypted');
        }
        if (isset($validated['expediteur_nom'])) {
            $this->setSetting('mail.from_name', $validated['expediteur_nom']);
        }
        if (isset($validated['expediteur_email'])) {
            $this->setSetting('mail.from_address', $validated['expediteur_email']);
        }
        if (isset($validated['reply_to'])) {
            $this->setSetting('mail.reply_to', $validated['reply_to']);
        }
        if (isset($validated['signature'])) {
            $this->setSetting('mail.signature', $validated['signature']);
        }
        if (isset($validated['copie_archive'])) {
            $this->setSetting('mail.archive_address', $validated['copie_archive']);
        }
        if (isset($validated['ssl'])) {
            $this->setSetting('mail.ssl', $validated['ssl']);
        }

        return response()->json([
            'message' => 'Configuration email mise à jour avec succès',
        ]);
    }

    /**
     * Envoyer un email de test
     */
    public function sendTest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'template_id' => 'nullable|exists:email_templates,id',
        ]);

        try {
            // Configurer le mailer SMTP depuis la base de données
            $this->configureMailer();
            
            $sujet = 'Test de configuration email - LOJISTIGA';
            $contenu = "Ceci est un email de test pour vérifier la configuration SMTP.\n\nSi vous recevez cet email, votre configuration est correcte.";

            if (isset($validated['template_id']) && $validated['template_id']) {
                $template = \App\Models\EmailTemplate::find($validated['template_id']);
                if ($template) {
                    $testData = [
                        'nom_client' => 'Client Test',
                        'numero_devis' => 'DEV-TEST-001',
                        'numero_facture' => 'FAC-TEST-001',
                        'numero_ordre' => 'OT-TEST-001',
                        'montant_ttc' => '1 500 000 FCFA',
                        'date_validite' => date('d/m/Y', strtotime('+30 days')),
                        'nom_entreprise' => 'LOJISTIGA',
                        'signature' => $this->getSetting('mail.signature', "L'équipe LOJISTIGA"),
                    ];
                    $rendered = $template->render($testData);
                    $sujet = $rendered['objet'];
                    $contenu = $rendered['contenu'];
                }
            }

            $fromEmail = $this->getSetting('mail.from_address', config('mail.from.address'));
            $fromName = $this->getSetting('mail.from_name', config('mail.from.name'));

            Mail::raw($contenu, function ($mail) use ($validated, $sujet, $fromEmail, $fromName) {
                $mail->to($validated['email'])
                    ->subject($sujet)
                    ->from($fromEmail, $fromName);
            });

            return response()->json([
                'message' => 'Email de test envoyé avec succès à ' . $validated['email'],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erreur envoi email test', [
                'email' => $validated['email'],
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Erreur lors de l\'envoi de l\'email de test',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Configurer le mailer SMTP depuis les paramètres de la base de données
     */
    private function configureMailer(): void
    {
        $smtpHost = Setting::get('mail.smtp_host');
        $smtpPort = Setting::get('mail.smtp_port');
        $smtpUser = Setting::get('mail.smtp_user');
        $smtpPassword = Setting::get('mail.smtp_password');
        $ssl = Setting::get('mail.ssl', true);
        
        // Convertir ssl en booléen si c'est une chaîne
        if (is_string($ssl)) {
            $ssl = filter_var($ssl, FILTER_VALIDATE_BOOLEAN);
        }

        \Illuminate\Support\Facades\Log::info('Configuration SMTP chargée pour test', [
            'host' => $smtpHost,
            'port' => $smtpPort,
            'user' => $smtpUser,
            'password_set' => !empty($smtpPassword),
            'ssl' => $ssl,
        ]);

        if ($smtpHost && $smtpPort && $smtpUser && $smtpPassword) {
            Config::set('mail.mailers.smtp.host', $smtpHost);
            Config::set('mail.mailers.smtp.port', (int) $smtpPort);
            Config::set('mail.mailers.smtp.username', $smtpUser);
            Config::set('mail.mailers.smtp.password', $smtpPassword);
            Config::set('mail.mailers.smtp.encryption', $ssl ? 'tls' : null);
            
            \Illuminate\Support\Facades\Log::info('Mailer SMTP configuré dynamiquement', [
                'encryption' => $ssl ? 'tls' : 'none',
            ]);
        } else {
            \Illuminate\Support\Facades\Log::warning('Configuration SMTP incomplète pour test', [
                'host' => $smtpHost ? 'OK' : 'manquant',
                'port' => $smtpPort ? 'OK' : 'manquant',
                'user' => $smtpUser ? 'OK' : 'manquant',
                'password' => $smtpPassword ? 'OK' : 'manquant',
            ]);
        }
    }

    /**
     * Obtenir un paramètre
     */
    private function getSetting(string $key, $default = null)
    {
        $setting = Setting::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Définir un paramètre
     */
    private function setSetting(string $key, $value, string $type = 'string'): void
    {
        Setting::set($key, $value, 'mail', $type);
    }
}
