<?php

namespace App\Observers;

use App\Models\Facture;
use App\Events\FactureCreated;
use App\Events\FactureUpdated;

class FactureObserver
{
    /**
     * Handle the Facture "created" event.
     */
    public function created(Facture $facture): void
    {
        $facture->load('client');
        
        // Dispatcher l'événement au lieu d'appeler directement le service
        event(new FactureCreated($facture));
    }

    /**
     * Handle the Facture "updated" event.
     */
    public function updated(Facture $facture): void
    {
        $changedAttributes = $facture->getChanges();
        
        event(new FactureUpdated($facture, $changedAttributes));
    }
}
