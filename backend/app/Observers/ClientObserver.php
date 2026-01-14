<?php

namespace App\Observers;

use App\Models\Client;
use App\Events\ClientCreated;

class ClientObserver
{
    /**
     * Handle the Client "created" event.
     */
    public function created(Client $client): void
    {
        // Dispatcher l'événement au lieu d'appeler directement le service
        event(new ClientCreated($client));
    }
}
