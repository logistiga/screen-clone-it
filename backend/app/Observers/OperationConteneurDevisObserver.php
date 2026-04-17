<?php

namespace App\Observers;

use App\Models\OperationConteneurDevis;
use App\Observers\Concerns\RecalculeDevisTotaux;

class OperationConteneurDevisObserver
{
    use RecalculeDevisTotaux;

    public function saved(OperationConteneurDevis $op): void
    {
        $conteneur = $op->conteneur()->first();
        $this->recalculerDevis($conteneur?->devis()->first());
    }

    public function deleted(OperationConteneurDevis $op): void
    {
        $conteneur = $op->conteneur()->first();
        $this->recalculerDevis($conteneur?->devis()->first());
    }
}
