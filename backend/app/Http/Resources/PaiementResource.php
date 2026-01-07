<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaiementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'montant' => round($this->montant, 2),
            'mode_paiement' => $this->mode_paiement,
            'reference' => $this->reference,
            'date_paiement' => $this->date_paiement?->toDateString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            
            // Relations
            'facture' => new FactureResource($this->whenLoaded('facture')),
            'client' => new ClientResource($this->whenLoaded('client')),
            'banque' => new BanqueResource($this->whenLoaded('banque')),
        ];
    }
}
