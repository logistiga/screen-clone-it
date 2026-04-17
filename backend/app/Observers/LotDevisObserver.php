<?php

namespace App\Observers;

use App\Models\LotDevis;
use App\Observers\Concerns\RecalculeDevisTotaux;

class LotDevisObserver
{
    use RecalculeDevisTotaux;

    public function saved(LotDevis $l): void { $this->recalculerDevis($l->devis()->first()); }
    public function deleted(LotDevis $l): void { $this->recalculerDevis($l->devis()->first()); }
}
