<?php

namespace App\Services;

use App\Models\Facture;
use App\Models\Devis;
use App\Models\Client;
use App\Models\OrdreTravail;
use App\Models\Paiement;
use App\Models\CreditBancaire;
use App\Models\User;
use App\Services\Notification\NotificationEmailService;
use App\Services\Notification\NotificationRappelService;

/**
 * Façade NotificationService — délègue à NotificationEmailService et NotificationRappelService
 */
class NotificationService
{
    protected NotificationEmailService $email;
    protected NotificationRappelService $rappel;

    public function __construct()
    {
        $this->email = new NotificationEmailService();
        $this->rappel = new NotificationRappelService();
    }

    // === Email documents ===
    public function envoyerFacture(Facture $facture, ?string $emailDestinataire = null, ?string $message = null, ?string $pdfBase64 = null): bool
    { return $this->email->envoyerFacture($facture, $emailDestinataire, $message, $pdfBase64); }

    public function envoyerDevis(Devis $devis, ?string $emailDestinataire = null, ?string $message = null, ?string $pdfBase64 = null): bool
    { return $this->email->envoyerDevis($devis, $emailDestinataire, $message, $pdfBase64); }

    public function envoyerOrdreTravail(OrdreTravail $ordre, ?string $emailDestinataire = null, ?string $message = null, ?string $pdfBase64 = null): bool
    { return $this->email->envoyerOrdreTravail($ordre, $emailDestinataire, $message, $pdfBase64); }

    public function envoyerConfirmationPaiement(Paiement $paiement, ?string $emailDestinataire = null): bool
    { return $this->email->envoyerConfirmationPaiement($paiement, $emailDestinataire); }

    // === Rappels & alertes ===
    public function envoyerRappelFacture(Facture $facture, int $numeroRappel = 1): bool
    { return $this->rappel->envoyerRappelFacture($facture, $numeroRappel); }

    public function envoyerRappelsAutomatiques(): array
    { return $this->rappel->envoyerRappelsAutomatiques(); }

    public function envoyerAlerteEcheanceCredit(CreditBancaire $credit, int $joursRestants): bool
    { return $this->rappel->envoyerAlerteEcheanceCredit($credit, $joursRestants); }

    public function envoyerRecapitulatifQuotidien(): bool
    { return $this->rappel->envoyerRecapitulatifQuotidien(); }

    public function notifierNouveauClient(Client $client): bool
    { return $this->rappel->notifierNouveauClient($client); }

    public function envoyerEmailPersonnalise(string $destinataire, string $sujet, string $contenu, ?array $pieces_jointes = null): bool
    { return $this->rappel->envoyerEmailPersonnalise($destinataire, $sujet, $contenu, $pieces_jointes); }
}
