<?php

namespace App\Observers;

use App\Models\LigneDevis;
use App\Observers\Concerns\RecalculeDevisTotaux;

class LigneDevisObserver
{
    use RecalculeDevisTotaux;

    public function saved(LigneDevis $l): void { $this->recalculerDevis($l->devis()->first()); }
    public function deleted(LigneDevis $l): void { $this->recalculerDevis($l->devis()->first()); }
}
