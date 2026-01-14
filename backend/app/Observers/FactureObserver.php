<?php

namespace App\Observers;

use App\Models\Facture;
use App\Services\NotificationService;

class FactureObserver
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the Facture "created" event.
     */
    public function created(Facture $facture): void
    {
        // Charger les relations nécessaires
        $facture->load('client');
        
        // Envoyer une notification
        $this->notificationService->notifyNewFacture($facture);
    }
}
