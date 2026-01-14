<?php

namespace App\Events;

use App\Models\CreditBancaire;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CreditEcheanceApproaching
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public CreditBancaire $credit,
        public int $joursRestants
    ) {}
}
