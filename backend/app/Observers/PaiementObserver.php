<?php

namespace App\Observers;

use App\Models\Paiement;
use App\Events\PaiementCreated;

class PaiementObserver
{
    /**
     * Handle the Paiement "created" event.
     */
    public function created(Paiement $paiement): void
    {
        $paiement->load(['facture.client', 'ordre.client']);
        
        // Dispatcher l'événement au lieu d'appeler directement le service
        event(new PaiementCreated($paiement));
    }
}
