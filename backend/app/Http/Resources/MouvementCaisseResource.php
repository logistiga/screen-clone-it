<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MouvementCaisseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'categorie' => $this->categorie,
            'montant' => round($this->montant, 2),
            'description' => $this->description,
            'beneficiaire' => $this->beneficiaire,
            'reference' => $this->reference,
            'date_mouvement' => $this->date_mouvement?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
            
            // Relations
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
