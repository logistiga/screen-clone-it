<?php

namespace App\Observers;

use App\Models\ConteneurDevis;
use App\Observers\Concerns\RecalculeDevisTotaux;

class ConteneurDevisObserver
{
    use RecalculeDevisTotaux;

    public function saved(ConteneurDevis $c): void { $this->recalculerDevis($c->devis()->first()); }
    public function deleted(ConteneurDevis $c): void { $this->recalculerDevis($c->devis()->first()); }
}
