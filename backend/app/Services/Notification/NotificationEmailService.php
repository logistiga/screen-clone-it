<?php

namespace App\Services\Notification;

use App\Models\Facture;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Paiement;
use App\Models\Setting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * Envoi d'emails pour documents : factures, devis, ordres, confirmations de paiement
 */
class NotificationEmailService
{
    use MailConfigTrait;

    public function envoyerFacture(Facture $facture, ?string $emailDestinataire = null, ?string $message = null, ?string $pdfBase64 = null): bool
    {
        $mailConfig = $this->configureMailer();
        $facture->loadMissing(['client', 'lignes']);
        $client = $facture->client;
        $email = $emailDestinataire ?: ($client?->email);

        if (!$email) {
            Log::warning("Impossible d'envoyer la facture {$facture->numero}: pas d'email", ['facture_id' => $facture->id]);
            return false;
        }

        try {
            [$pdfContent, $pdfFilename] = $this->resolvePdf($pdfBase64, "Facture_{$facture->numero}.pdf", 'pdf.facture', [
                'facture' => $facture, 'client' => $client,
            ], $facture->numero, 'Facture');

            Mail::send('emails.facture', [
                'facture' => $facture, 'client' => $client,
                'message_personnalise' => $message ?? '', 'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $facture, $mailConfig, $pdfContent, $pdfFilename) {
                $mail->to($email)->subject("Facture N° {$facture->numero}")->from($mailConfig['from_email'], $mailConfig['from_name']);
                if (!empty($pdfContent) && !empty($pdfFilename)) {
                    $mail->attachData($pdfContent, $pdfFilename, ['mime' => 'application/pdf']);
                }
            });

            $facture->forceFill(['statut' => 'envoye', 'date_envoi' => now()])->save();
            Log::info("Facture {$facture->numero} envoyée avec succès à {$email}");
            return true;
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    public function envoyerDevis(Devis $devis, ?string $emailDestinataire = null, ?string $message = null, ?string $pdfBase64 = null): bool
    {
        $mailConfig = $this->configureMailer();
        $devis->loadMissing(['client', 'lignes', 'conteneurs.operations', 'lots']);
        $client = $devis->client;
        $email = $emailDestinataire ?: ($client?->email);

        if (!$email) {
            Log::warning("Impossible d'envoyer le devis {$devis->numero}: pas d'email", ['devis_id' => $devis->id]);
            return false;
        }

        try {
            [$pdfContent, $pdfFilename] = $this->resolvePdf($pdfBase64, "Devis_{$devis->numero}.pdf", 'pdf.devis', [
                'devis' => $devis, 'client' => $client,
            ], $devis->numero, 'Devis');

            Mail::send('emails.devis', [
                'devis' => $devis, 'client' => $client,
                'message_personnalise' => $message ?? '', 'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $devis, $mailConfig, $pdfContent, $pdfFilename) {
                $mail->to($email)->subject("Devis N° {$devis->numero}")->from($mailConfig['from_email'], $mailConfig['from_name']);
                if (!empty($pdfContent) && !empty($pdfFilename)) {
                    $mail->attachData($pdfContent, $pdfFilename, ['mime' => 'application/pdf']);
                }
            });

            $devis->forceFill(['statut' => 'envoye', 'date_envoi' => now()])->save();
            Log::info("Devis {$devis->numero} envoyé avec succès à {$email}");
            return true;
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    public function envoyerOrdreTravail(OrdreTravail $ordre, ?string $emailDestinataire = null, ?string $message = null, ?string $pdfBase64 = null): bool
    {
        $mailConfig = $this->configureMailer();
        $ordre->loadMissing(['client', 'conteneurs.operations', 'lots']);
        $client = $ordre->client;
        $email = $emailDestinataire ?: ($client?->email);

        if (!$email) {
            Log::warning("Impossible d'envoyer l'ordre {$ordre->numero}: pas d'email", ['ordre_id' => $ordre->id]);
            return false;
        }

        try {
            [$pdfContent, $pdfFilename] = $this->resolvePdf($pdfBase64, "OrdreTravail_{$ordre->numero}.pdf", 'pdf.ordre-travail', [
                'ordre' => $ordre, 'client' => $client,
            ], $ordre->numero, 'Ordre');

            Mail::send('emails.ordre-travail', [
                'ordre' => $ordre, 'client' => $client,
                'message_personnalise' => $message ?? '', 'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $ordre, $mailConfig, $pdfContent, $pdfFilename) {
                $mail->to($email)->subject("Ordre de Travail N° {$ordre->numero}")->from($mailConfig['from_email'], $mailConfig['from_name']);
                if (!empty($pdfContent) && !empty($pdfFilename)) {
                    $mail->attachData($pdfContent, $pdfFilename, ['mime' => 'application/pdf']);
                }
            });

            Log::info("Ordre de travail {$ordre->numero} envoyé avec succès à {$email}");
            return true;
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    public function envoyerConfirmationPaiement(Paiement $paiement, ?string $emailDestinataire = null): bool
    {
        $mailConfig = $this->configureMailer();
        $paiement->loadMissing(['facture.client', 'ordre.client']);
        $facture = $paiement->facture;
        $ordre = $paiement->ordre;
        $client = $facture?->client ?? $ordre?->client;
        $email = $emailDestinataire ?: ($client?->email);

        if (!$email) {
            Log::warning("Impossible d'envoyer la confirmation de paiement: pas d'email", ['paiement_id' => $paiement->id]);
            return false;
        }

        try {
            Mail::send('emails.confirmation-paiement', [
                'paiement' => $paiement, 'facture' => $facture, 'ordre' => $ordre,
                'client' => $client, 'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $paiement, $mailConfig) {
                $mail->to($email)->subject("Confirmation de paiement - {$paiement->reference}")->from($mailConfig['from_email'], $mailConfig['from_name']);
            });

            Log::info("Confirmation de paiement envoyée à {$email}");
            return true;
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    /**
     * Résoudre le PDF : depuis base64 frontend ou génération backend
     */
    private function resolvePdf(?string $pdfBase64, string $filename, string $view, array $viewData, string $numero, string $type): array
    {
        if ($pdfBase64) {
            $decoded = base64_decode($pdfBase64, true);
            if ($decoded !== false && $decoded !== '') {
                Log::info("{$type} {$numero}: Utilisation du PDF frontend");
                return [$decoded, $filename];
            }
            Log::warning("{$type} {$numero}: pdf_base64 invalide, envoi sans pièce jointe");
        } else {
            if (class_exists(Pdf::class)) {
                $pdf = Pdf::loadView($view, $viewData);
                $pdf->setPaper('A4', 'portrait');
                Log::info("{$type} {$numero}: Génération du PDF backend (fallback)");
                return [$pdf->output(), $filename];
            }
            Log::warning("{$type} {$numero}: DomPDF indisponible, envoi sans pièce jointe");
        }
        return [null, null];
    }
}
