<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnnulationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'type' => $this->type,
            'document_id' => $this->document_id,
            'document_numero' => $this->document_numero,
            'client_id' => $this->client_id,
            'montant' => (float) $this->montant,
            'date' => $this->date?->toDateString(),
            'motif' => $this->motif,
            'avoir_genere' => (bool) $this->avoir_genere,
            'numero_avoir' => $this->numero_avoir,
            'rembourse' => (bool) $this->rembourse,
            'montant_rembourse' => (float) ($this->montant_rembourse ?? 0),
            'date_remboursement' => $this->date_remboursement?->toDateString(),
            'solde_avoir' => (float) ($this->solde_avoir ?? 0),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations
            'client' => new ClientResource($this->whenLoaded('client')),
        ];
    }
}
