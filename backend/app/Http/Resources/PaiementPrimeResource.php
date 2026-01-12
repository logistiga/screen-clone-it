<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaiementPrimeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transitaire_id' => $this->transitaire_id,
            'representant_id' => $this->representant_id,
            'montant' => round($this->montant, 2),
            'mode_paiement' => $this->mode_paiement,
            'reference' => $this->reference,
            'date' => $this->date?->toDateString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            
            // Primes liées à ce paiement
            'primes' => PrimeResource::collection($this->whenLoaded('primes')),
        ];
    }
}
