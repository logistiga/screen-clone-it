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
            'motif' => $this->motif,
            'date_annulation' => $this->date_annulation?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
            
            // Relations
            'facture' => new FactureResource($this->whenLoaded('facture')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
