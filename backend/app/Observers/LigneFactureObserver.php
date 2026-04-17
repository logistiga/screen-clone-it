<?php

namespace App\Observers;

use App\Models\LigneFacture;
use App\Observers\Concerns\RecalculeFactureTotaux;

class LigneFactureObserver
{
    use RecalculeFactureTotaux;

    public function saved(LigneFacture $l): void { $this->recalculerFacture($l->facture()->first()); }
    public function deleted(LigneFacture $l): void { $this->recalculerFacture($l->facture()->first()); }
}
