<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentCreditResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'nom_fichier' => $this->nom_fichier,
            'chemin' => $this->chemin,
            'url' => asset('storage/' . $this->chemin),
            'description' => $this->description,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
