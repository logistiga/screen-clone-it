<?php

namespace App\Observers;

use App\Models\OperationConteneurFacture;
use App\Observers\Concerns\RecalculeFactureTotaux;

class OperationConteneurFactureObserver
{
    use RecalculeFactureTotaux;

    public function saved(OperationConteneurFacture $op): void
    {
        $conteneur = $op->conteneur()->first();
        $this->recalculerFacture($conteneur?->facture()->first());
    }

    public function deleted(OperationConteneurFacture $op): void
    {
        $conteneur = $op->conteneur()->first();
        $this->recalculerFacture($conteneur?->facture()->first());
    }
}
