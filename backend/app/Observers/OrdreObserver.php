<?php

namespace App\Observers;

use App\Models\OrdreTravail;
use App\Events\OrdreCreated;
use App\Events\OrdreUpdated;
use App\Events\OrdreDeleted;

class OrdreObserver
{
    public function created(OrdreTravail $ordre): void
    {
        $ordre->load('client');
        event(new OrdreCreated($ordre));
    }

    public function updated(OrdreTravail $ordre): void
    {
        $changedAttributes = $ordre->getChanges();
        event(new OrdreUpdated($ordre, $changedAttributes));
    }

    public function deleting(OrdreTravail $ordre): void
    {
        $ordre->load('client');
        event(new OrdreDeleted($ordre));
    }
}
