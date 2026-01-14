<?php

namespace App\Observers;

use App\Models\Paiement;
use App\Services\NotificationService;
use App\Services\CacheService;

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

        // Invalider le cache dashboard
        CacheService::invalidateDashboard();
    }

    /**
     * Handle the Paiement "updated" event.
     */
    public function updated(Paiement $paiement): void
    {
        CacheService::invalidateDashboard();
    }

    /**
     * Handle the Paiement "deleted" event.
     */
    public function deleted(Paiement $paiement): void
    {
        CacheService::invalidateDashboard();
    }
}
