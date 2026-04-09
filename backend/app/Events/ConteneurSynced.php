<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConteneurSynced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $nouveaux;
    public int $mis_a_jour;
    public string $message;
    public string $timestamp;

    public function __construct(int $nouveaux = 0, int $mis_a_jour = 0, string $message = '')
    {
        $this->nouveaux = $nouveaux;
        $this->mis_a_jour = $mis_a_jour;
        $this->message = $message ?: "{$nouveaux} nouveau(x) conteneur(s) synchronisé(s)";
        $this->timestamp = now()->toIso8601String();
    }

    public function broadcastOn(): Channel
    {
        return new Channel('logistiga-fac');
    }

    public function broadcastAs(): string
    {
        return 'conteneur.synced';
    }

    public function broadcastWith(): array
    {
        return [
            'nouveaux' => $this->nouveaux,
            'mis_a_jour' => $this->mis_a_jour,
            'message' => $this->message,
            'timestamp' => $this->timestamp,
        ];
    }
}
