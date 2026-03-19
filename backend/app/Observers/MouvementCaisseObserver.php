<?php

namespace App\Observers;

use App\Models\MouvementCaisse;
use App\Services\PrevisionSyncService;

class MouvementCaisseObserver
{
    public function __construct(
        private PrevisionSyncService $syncService
    ) {}

    public function created(MouvementCaisse $mouvement): void
    {
        $this->syncPrevisions($mouvement);
    }

    public function updated(MouvementCaisse $mouvement): void
    {
        $this->syncPrevisions($mouvement);
    }

    public function deleted(MouvementCaisse $mouvement): void
    {
        $this->syncPrevisions($mouvement);
    }

    private function syncPrevisions(MouvementCaisse $mouvement): void
    {
        if ($mouvement->date) {
            $this->syncService->syncFromDate($mouvement->date);
        }
    }
}
