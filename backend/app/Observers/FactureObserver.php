<?php

namespace App\Observers;

use App\Models\Facture;
use App\Services\NotificationService;
use App\Services\CacheService;

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

        // Invalider le cache dashboard
        CacheService::invalidateDashboard();
    }

    /**
     * Handle the Facture "updated" event.
     */
    public function updated(Facture $facture): void
    {
        CacheService::invalidateDashboard();
    }

    /**
     * Handle the Facture "deleted" event.
     */
    public function deleted(Facture $facture): void
    {
        CacheService::invalidateDashboard();
    }
}
