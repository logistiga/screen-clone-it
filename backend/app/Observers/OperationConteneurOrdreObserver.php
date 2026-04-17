<?php

namespace App\Observers;

use App\Models\OperationConteneurOrdre;
use App\Services\OrdreTravail\OrdreServiceFactory;

class OperationConteneurOrdreObserver
{
    public function saved(OperationConteneurOrdre $op): void
    {
        $this->recalculer($op);
    }

    public function deleted(OperationConteneurOrdre $op): void
    {
        $this->recalculer($op);
    }

    protected function recalculer(OperationConteneurOrdre $op): void
    {
        try {
            $conteneur = $op->conteneur()->first();
            if (!$conteneur) return;
            $ordre = $conteneur->ordre()->first();
            if (!$ordre) return;

            $service = app(OrdreServiceFactory::class)->getService($ordre->categorie);
            $service->calculerTotaux($ordre->fresh(['conteneurs.operations', 'lots', 'lignes']));
        } catch (\Throwable $e) {
            \Log::warning('Recalcul auto OT échoué (OperationConteneurOrdre)', [
                'op_id' => $op->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
