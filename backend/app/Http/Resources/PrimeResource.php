<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrimeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $montantPaye = 0;
        if ($this->relationLoaded('paiements')) {
            $montantPaye = $this->paiements->sum('montant');
        }
        $resteAPayer = $this->montant - $montantPaye;
        
        return [
            'id' => $this->id,
            'ordre_id' => $this->ordre_id,
            'facture_id' => $this->facture_id,
            'transitaire_id' => $this->transitaire_id,
            'representant_id' => $this->representant_id,
            'montant' => round($this->montant, 2),
            'description' => $this->description,
            'statut' => $this->statut,
            'created_at' => $this->created_at?->toISOString(),
            
            // Paiements calculés
            'montant_paye' => round($montantPaye, 2),
            'reste_a_payer' => round(max(0, $resteAPayer), 2),
            
            // Relations
            'ordre' => $this->whenLoaded('ordre', fn() => $this->ordre ? new OrdreTravailResource($this->ordre) : null),
            'representant' => $this->whenLoaded('representant', fn() => $this->representant ? new RepresentantResource($this->representant) : null),
            'transitaire' => $this->whenLoaded('transitaire', fn() => $this->transitaire ? new TransitaireResource($this->transitaire) : null),
            'facture' => $this->whenLoaded('facture', fn() => $this->facture ? new FactureResource($this->facture) : null),
            'paiements' => PaiementPrimeResource::collection($this->whenLoaded('paiements')),
        ];
    }
}
