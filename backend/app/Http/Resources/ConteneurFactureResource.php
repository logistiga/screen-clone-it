<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConteneurFactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'type' => $this->type,
            'taille' => $this->taille,
            'armateur' => new ArmateurResource($this->whenLoaded('armateur')),
            'operations' => OperationConteneurFactureResource::collection($this->whenLoaded('operations')),
            'montant_total' => $this->when($this->operations, fn() => 
                $this->operations->sum('montant_ht')
            ),
        ];
    }
}
