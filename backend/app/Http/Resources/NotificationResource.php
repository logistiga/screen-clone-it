<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'titre' => $this->titre,
            'message' => $this->message,
            'data' => $this->data,
            'lue' => (bool) $this->lue,
            'lue_at' => $this->lue_at?->toISOString(),
            'priorite' => $this->priorite ?? 'normale',
            'action_url' => $this->action_url,
            'icon' => $this->getIcon(),
            'color' => $this->getColor(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'temps_relatif' => $this->created_at?->diffForHumans(),
        ];
    }

    protected function getIcon(): string
    {
        return match ($this->type) {
            'facture' => 'file-text',
            'paiement' => 'credit-card',
            'devis' => 'file-check',
            'ordre' => 'clipboard-list',
            'client' => 'users',
            'alerte' => 'alert-triangle',
            'systeme' => 'settings',
            default => 'bell',
        };
    }

    protected function getColor(): string
    {
        return match ($this->priorite ?? 'normale') {
            'haute' => 'red',
            'moyenne' => 'orange',
            'basse' => 'gray',
            default => 'blue',
        };
    }
}
