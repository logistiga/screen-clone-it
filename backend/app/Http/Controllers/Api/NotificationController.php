<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Paiement;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Envoyer une facture par email
     */
    public function envoyerFacture(Request $request, Facture $facture): JsonResponse
    {
        $request->validate([
            'email' => 'nullable|email',
            'message' => 'nullable|string|max:1000',
            'pdf_base64' => 'nullable|string',
        ]);

        try {
            $facture->loadMissing('client');

            $success = $this->notificationService->envoyerFacture(
                $facture,
                $request->email,
                $request->message,
                $request->pdf_base64
            );

            if ($success) {
                return response()->json([
                    'message' => 'Facture envoyée avec succès',
                    'facture' => $facture->fresh(),
                ]);
            }

            return response()->json([
                'message' => 'Erreur lors de l\'envoi de la facture',
                'error' => config('app.debug') ? 'NotificationService::envoyerFacture a retourné false' : null,
            ], 500);
        } catch (\Throwable $e) {
            Log::error("Controller: Erreur envoi facture {$facture->numero}", [
                'facture_id' => $facture->id,
                'email_override' => $request->email ?? null,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de l\'envoi de la facture',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Envoyer un devis par email
     */
    public function envoyerDevis(Request $request, Devis $devis): JsonResponse
    {
        $request->validate([
            'email' => 'nullable|email',
            'message' => 'nullable|string|max:1000',
            'pdf_base64' => 'nullable|string',
        ]);

        try {
            $devis->loadMissing('client');

            $success = $this->notificationService->envoyerDevis(
                $devis,
                $request->email,
                $request->message,
                $request->pdf_base64
            );

            if ($success) {
                return response()->json([
                    'message' => 'Devis envoyé avec succès',
                    'devis' => $devis->fresh(),
                ]);
            }

            return response()->json([
                'message' => 'Erreur lors de l\'envoi du devis',
                'error' => config('app.debug') ? 'NotificationService::envoyerDevis a retourné false' : null,
            ], 500);
        } catch (\Throwable $e) {
            Log::error("Controller: Erreur envoi devis {$devis->numero}", [
                'devis_id' => $devis->id,
                'email_override' => $request->email ?? null,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de l\'envoi du devis',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Envoyer un ordre de travail par email
     */
    public function envoyerOrdre(Request $request, OrdreTravail $ordre): JsonResponse
    {
        $request->validate([
            'email' => 'nullable|email',
            'message' => 'nullable|string|max:1000',
            'pdf_base64' => 'nullable|string',
        ]);

        $success = $this->notificationService->envoyerOrdreTravail(
            $ordre,
            $request->email,
            $request->message,
            $request->pdf_base64
        );

        if ($success) {
            return response()->json([
                'message' => 'Ordre de travail envoyé avec succès',
            ]);
        }

        return response()->json([
            'message' => 'Erreur lors de l\'envoi de l\'ordre de travail',
        ], 500);
    }

    /**
     * Envoyer une confirmation de paiement
     */
    public function envoyerConfirmationPaiement(Request $request, Paiement $paiement): JsonResponse
    {
        $request->validate([
            'email' => 'nullable|email',
        ]);

        $success = $this->notificationService->envoyerConfirmationPaiement(
            $paiement,
            $request->email
        );

        if ($success) {
            return response()->json([
                'message' => 'Confirmation de paiement envoyée avec succès',
            ]);
        }

        return response()->json([
            'message' => 'Erreur lors de l\'envoi de la confirmation',
        ], 500);
    }

    /**
     * Envoyer un rappel de facture
     */
    public function envoyerRappel(Request $request, Facture $facture): JsonResponse
    {
        $numeroRappel = ($facture->nombre_rappels ?? 0) + 1;

        $success = $this->notificationService->envoyerRappelFacture($facture, $numeroRappel);

        if ($success) {
            return response()->json([
                'message' => "Rappel N°{$numeroRappel} envoyé avec succès",
                'facture' => $facture->fresh(),
            ]);
        }

        return response()->json([
            'message' => 'Erreur lors de l\'envoi du rappel',
        ], 500);
    }

    /**
     * Déclencher les rappels automatiques
     */
    public function rappelsAutomatiques(): JsonResponse
    {
        $resultats = $this->notificationService->envoyerRappelsAutomatiques();

        return response()->json([
            'message' => "Rappels automatiques terminés: {$resultats['envoyes']} envoyés, {$resultats['echecs']} échecs",
            'resultats' => $resultats,
        ]);
    }

    /**
     * Envoyer le récapitulatif quotidien
     */
    public function recapitulatifQuotidien(): JsonResponse
    {
        $success = $this->notificationService->envoyerRecapitulatifQuotidien();

        if ($success) {
            return response()->json([
                'message' => 'Récapitulatif quotidien envoyé avec succès',
            ]);
        }

        return response()->json([
            'message' => 'Erreur lors de l\'envoi du récapitulatif',
        ], 500);
    }

    /**
     * Envoyer un email personnalisé
     */
    public function envoyerEmailPersonnalise(Request $request): JsonResponse
    {
        $request->validate([
            'destinataire' => 'required|email',
            'sujet' => 'required|string|max:255',
            'contenu' => 'required|string',
        ]);

        $success = $this->notificationService->envoyerEmailPersonnalise(
            $request->destinataire,
            $request->sujet,
            $request->contenu
        );

        if ($success) {
            return response()->json([
                'message' => 'Email envoyé avec succès',
            ]);
        }

        return response()->json([
            'message' => 'Erreur lors de l\'envoi de l\'email',
        ], 500);
    }
}
