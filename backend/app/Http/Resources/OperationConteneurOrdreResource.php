<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OperationConteneurOrdreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            // Champs DB
            'type' => $this->type,
            'description' => $this->description,
            'quantite' => (float) ($this->quantite ?? 0),
            'prix_unitaire' => round((float) ($this->prix_unitaire ?? 0), 2),
            'prix_total' => round((float) ($this->prix_total ?? (($this->quantite ?? 0) * ($this->prix_unitaire ?? 0))), 2),

            // Alias compat front
            'type_operation' => $this->type,
            'montant_ht' => round((float) ($this->prix_total ?? (($this->quantite ?? 0) * ($this->prix_unitaire ?? 0))), 2),
        ];
    }
}
