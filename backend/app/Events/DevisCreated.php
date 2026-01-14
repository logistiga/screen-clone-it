<?php

namespace App\Events;

use App\Models\Devis;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DevisCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Devis $devis
    ) {}
}
