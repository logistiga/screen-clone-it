<?php

namespace App\Events;

use App\Models\OrdreTravail;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrdreCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public OrdreTravail $ordre
    ) {}
}
