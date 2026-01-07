<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EcheanceCreditResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero_echeance' => $this->numero_echeance,
            'date_echeance' => $this->date_echeance?->toDateString(),
            'montant' => round($this->montant, 2),
            'statut' => $this->statut,
            'date_paiement' => $this->date_paiement?->toDateString(),
            'en_retard' => $this->statut === 'En attente' && $this->date_echeance < now(),
            
            // Relations
            'remboursements' => RemboursementCreditResource::collection($this->whenLoaded('remboursements')),
        ];
    }
}
