<?php

namespace App\Observers;

use App\Models\LigneOrdre;
use App\Services\OrdreTravail\OrdreServiceFactory;

class LigneOrdreObserver
{
    public function saved(LigneOrdre $ligne): void { $this->recalculer($ligne); }
    public function deleted(LigneOrdre $ligne): void { $this->recalculer($ligne); }

    protected function recalculer(LigneOrdre $ligne): void
    {
        try {
            $ordre = $ligne->ordre()->first();
            if (!$ordre) return;
            $service = app(OrdreServiceFactory::class)->getService($ordre->categorie);
            $service->calculerTotaux($ordre->fresh(['conteneurs.operations', 'lots', 'lignes']));
        } catch (\Throwable $e) {
            \Log::warning('Recalcul auto OT échoué (LigneOrdre)', [
                'ligne_id' => $ligne->id, 'error' => $e->getMessage(),
            ]);
        }
    }
}
