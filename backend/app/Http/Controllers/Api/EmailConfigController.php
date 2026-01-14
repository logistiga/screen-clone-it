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
            $this->setSetting('mail.smtp_password', encrypt($validated['smtp_password']));
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
            $sujet = 'Test de configuration email - LOJISTIGA';
            $contenu = "Ceci est un email de test pour vérifier la configuration SMTP.\n\nSi vous recevez cet email, votre configuration est correcte.";

            if ($validated['template_id']) {
                $template = \App\Models\EmailTemplate::find($validated['template_id']);
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

            Mail::raw($contenu, function ($mail) use ($validated, $sujet) {
                $mail->to($validated['email'])
                    ->subject($sujet)
                    ->from(
                        $this->getSetting('mail.from_address', config('mail.from.address')),
                        $this->getSetting('mail.from_name', config('mail.from.name'))
                    );
            });

            return response()->json([
                'message' => 'Email de test envoyé avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'envoi de l\'email de test',
                'error' => $e->getMessage(),
            ], 500);
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
    private function setSetting(string $key, $value): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}
