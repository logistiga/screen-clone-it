<?php

namespace App\Events;

use App\Models\Facture;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FactureUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Facture $facture,
        public array $changedAttributes = []
    ) {}

    public function wasStatusChanged(): bool
    {
        return isset($this->changedAttributes['statut']);
    }

    public function getOldStatus(): ?string
    {
        return $this->changedAttributes['statut'] ?? null;
    }
}
