<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrimeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $montantPaye = $this->whenLoaded('paiements', fn() => $this->paiements->sum('montant'), 0);
        
        return [
            'id' => $this->id,
            'montant' => round($this->montant, 2),
            'description' => $this->description,
            'statut' => $this->statut,
            'created_at' => $this->created_at?->toISOString(),
            
            // Paiements
            'montant_paye' => $this->when($this->montant_paye !== null, round($this->montant_paye, 2)),
            'reste_a_payer' => $this->when($this->reste_a_payer !== null, round($this->reste_a_payer, 2)),
            
            // Relations
            'representant' => new RepresentantResource($this->whenLoaded('representant')),
            'facture' => new FactureResource($this->whenLoaded('facture')),
            'paiements' => PaiementPrimeResource::collection($this->whenLoaded('paiements')),
        ];
    }
}
