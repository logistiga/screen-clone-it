<?php

namespace App\Listeners;

use App\Events\PaiementCreated;
use App\Services\PrevisionSyncService;

class SyncPrevisionRealise
{
    public function __construct(
        private PrevisionSyncService $syncService
    ) {}

    /**
     * Sync prévisions quand un paiement est créé
     */
    public function handle(PaiementCreated $event): void
    {
        $paiement = $event->paiement;
        
        if ($paiement->date) {
            $this->syncService->syncFromDate($paiement->date);
        }
    }
}
