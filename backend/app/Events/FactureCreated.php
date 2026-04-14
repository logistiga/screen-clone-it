<?php

namespace App\Events;

use App\Models\Facture;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// Désactivé ShouldBroadcast temporairement pour éviter erreur UTF-8 Pusher
class FactureCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $facture_id;
    public string $numero;
    public string $client;
    public float $montant;
    public string $message;
    public string $timestamp;

    public function __construct(Facture $facture)
    {
        $this->facture_id = $facture->id;
        $this->numero = self::sanitize($facture->numero ?? '');
        $this->client = self::sanitize($facture->client->nom ?? '');
        $this->montant = (float) ($facture->montant_ttc ?? 0);
        $this->message = "Facture {$this->numero} créée pour {$this->client}";
        $this->timestamp = now()->toIso8601String();
    }

    public function broadcastOn(): Channel
    {
        return new Channel('logistiga-fac');
    }

    public function broadcastAs(): string
    {
        return 'facture.created';
    }

    public function broadcastWith(): array
    {
        return [
            'facture_id' => $this->facture_id,
            'numero' => self::sanitize($this->numero),
            'client' => self::sanitize($this->client),
            'montant' => $this->montant,
            'message' => self::sanitize($this->message),
            'timestamp' => $this->timestamp,
        ];
    }

    /**
     * Nettoyer les chaînes UTF-8 malformées pour éviter les erreurs JSON
     */
    private static function sanitize(?string $value): string
    {
        if ($value === null) return '';
        return mb_convert_encoding($value, 'UTF-8', 'UTF-8');
    }
}
