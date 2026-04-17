<?php

namespace App\Observers;

use App\Models\LotFacture;
use App\Observers\Concerns\RecalculeFactureTotaux;

class LotFactureObserver
{
    use RecalculeFactureTotaux;

    public function saved(LotFacture $l): void { $this->recalculerFacture($l->facture()->first()); }
    public function deleted(LotFacture $l): void { $this->recalculerFacture($l->facture()->first()); }
}
