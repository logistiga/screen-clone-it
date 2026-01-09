<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConteneurDevisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $operations = $this->whenLoaded('operations');
        
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'taille' => $this->taille,
            'description' => $this->description,
            'prix_unitaire' => round((float) ($this->prix_unitaire ?? 0), 2),
            'operations' => OperationConteneurDevisResource::collection($operations),
            'montant_total' => $this->when($this->relationLoaded('operations'), fn() => 
                round((float) $this->operations->sum('prix_total'), 2)
            ),
        ];
    }
}
