<?php

namespace App\Observers;

use App\Models\Devis;
use App\Events\DevisCreated;
use App\Events\DevisUpdated;
use App\Events\DevisDeleted;

class DevisObserver
{
    public function created(Devis $devis): void
    {
        $devis->load('client');
        event(new DevisCreated($devis));
    }

    public function updated(Devis $devis): void
    {
        $changedAttributes = $devis->getChanges();
        event(new DevisUpdated($devis, $changedAttributes));
    }

    public function deleting(Devis $devis): void
    {
        $devis->load('client');
        event(new DevisDeleted($devis));
    }
}
