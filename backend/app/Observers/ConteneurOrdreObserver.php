<?php

namespace App\Observers;

use App\Models\ConteneurOrdre;
use App\Services\OrdreTravail\OrdreServiceFactory;

/**
 * Recalcule automatiquement les totaux de l'OT parent
 * dès qu'un conteneur est créé/modifié/supprimé.
 */
class ConteneurOrdreObserver
{
    public function saved(ConteneurOrdre $conteneur): void
    {
        $this->recalculer($conteneur);
    }

    public function deleted(ConteneurOrdre $conteneur): void
    {
        $this->recalculer($conteneur);
    }

    protected function recalculer(ConteneurOrdre $conteneur): void
    {
        try {
            $ordre = $conteneur->ordre()->first();
            if (!$ordre) return;

            $service = app(OrdreServiceFactory::class)->getService($ordre->categorie);
            $service->calculerTotaux($ordre->fresh(['conteneurs.operations', 'lots', 'lignes']));
        } catch (\Throwable $e) {
            \Log::warning('Recalcul auto OT échoué (ConteneurOrdre)', [
                'conteneur_id' => $conteneur->id,
                'ordre_id' => $conteneur->ordre_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
