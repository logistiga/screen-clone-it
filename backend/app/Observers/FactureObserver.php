<?php

namespace App\Observers;

use App\Models\Facture;
use App\Events\FactureCreated;
use App\Events\FactureUpdated;
use App\Events\FactureDeleted;

class FactureObserver
{
    public function created(Facture $facture): void
    {
        $facture->load('client');
        event(new FactureCreated($facture));
    }

    public function updated(Facture $facture): void
    {
        $changedAttributes = $facture->getChanges();
        event(new FactureUpdated($facture, $changedAttributes));
    }

    public function deleting(Facture $facture): void
    {
        $facture->load('client');
        event(new FactureDeleted($facture));
    }
}
