<?php

namespace App\Observers;

use App\Models\ConteneurFacture;
use App\Observers\Concerns\RecalculeFactureTotaux;

class ConteneurFactureObserver
{
    use RecalculeFactureTotaux;

    public function saved(ConteneurFacture $c): void { $this->recalculerFacture($c->facture()->first()); }
    public function deleted(ConteneurFacture $c): void { $this->recalculerFacture($c->facture()->first()); }
}
