<?php

namespace App\Observers;

use App\Models\LotOrdre;
use App\Services\OrdreTravail\OrdreServiceFactory;

class LotOrdreObserver
{
    public function saved(LotOrdre $lot): void { $this->recalculer($lot); }
    public function deleted(LotOrdre $lot): void { $this->recalculer($lot); }

    protected function recalculer(LotOrdre $lot): void
    {
        try {
            $ordre = $lot->ordre()->first();
            if (!$ordre) return;
            $service = app(OrdreServiceFactory::class)->make($ordre);
            $service->calculerTotaux($ordre->fresh(['conteneurs.operations', 'lots', 'lignes']));
        } catch (\Throwable $e) {
            \Log::warning('Recalcul auto OT échoué (LotOrdre)', [
                'lot_id' => $lot->id, 'error' => $e->getMessage(),
            ]);
        }
    }
}
