<?php

namespace App\Observers;

use App\Models\Paiement;
use App\Services\NotificationService;

class PaiementObserver
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the Paiement "created" event.
     */
    public function created(Paiement $paiement): void
    {
        // Charger les relations nécessaires
        $paiement->load(['facture.client', 'ordre.client']);
        
        // Envoyer une notification
        $this->notificationService->notifyNewPaiement($paiement);
    }
}
