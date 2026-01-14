<?php

namespace App\Observers;

use App\Models\Client;
use App\Services\NotificationService;

class ClientObserver
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the Client "created" event.
     */
    public function created(Client $client): void
    {
        // Envoyer une notification
        $this->notificationService->notifyNewClient($client);
    }
}
