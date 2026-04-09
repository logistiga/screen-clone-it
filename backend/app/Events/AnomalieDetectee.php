<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnomalieDetectee implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $type;
    public string $severity;
    public string $message;
    public array $details;
    public string $timestamp;

    public function __construct(string $type, string $severity, string $message, array $details = [])
    {
        $this->type = $type;
        $this->severity = $severity;
        $this->message = $message;
        $this->details = $details;
        $this->timestamp = now()->toIso8601String();
    }

    public function broadcastOn(): Channel
    {
        return new Channel('logistiga-fac');
    }

    public function broadcastAs(): string
    {
        return 'anomalie.detectee';
    }

    public function broadcastWith(): array
    {
        return [
            'type' => $this->type,
            'severity' => $this->severity,
            'message' => $this->message,
            'details' => $this->details,
            'timestamp' => $this->timestamp,
        ];
    }
}
