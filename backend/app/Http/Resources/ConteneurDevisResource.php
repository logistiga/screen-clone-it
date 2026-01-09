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
            'type' => $this->type ?? 'DRY',
            'taille' => $this->taille,
            'description' => $this->description,
            'armateur_id' => $this->armateur_id,
            'armateur' => new ArmateurResource($this->whenLoaded('armateur')),
            'operations' => OperationConteneurDevisResource::collection($operations),
            'montant_total' => $this->when($this->relationLoaded('operations'), fn() => 
                round((float) $this->operations->sum('prix_total'), 2)
            ),
        ];
    }
}
