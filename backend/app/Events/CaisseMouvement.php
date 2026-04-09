<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CaisseMouvement implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $type;
    public float $montant;
    public string $description;
    public string $caisse;
    public string $message;
    public string $timestamp;

    public function __construct(string $type, float $montant, string $description, string $caisse = 'principale')
    {
        $this->type = $type;
        $this->montant = $montant;
        $this->description = $description;
        $this->caisse = $caisse;
        $this->message = ucfirst($type) . " de " . number_format($montant, 0, ',', ' ') . " FCFA - {$description}";
        $this->timestamp = now()->toIso8601String();
    }

    public function broadcastOn(): Channel
    {
        return new Channel('logistiga-fac');
    }

    public function broadcastAs(): string
    {
        return 'caisse.mouvement';
    }

    public function broadcastWith(): array
    {
        return [
            'type' => $this->type,
            'montant' => $this->montant,
            'description' => $this->description,
            'caisse' => $this->caisse,
            'message' => $this->message,
            'timestamp' => $this->timestamp,
        ];
    }
}
