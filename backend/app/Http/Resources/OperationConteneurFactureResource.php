<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OperationConteneurFactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type_operation' => $this->type_operation,
            'description' => $this->description,
            'quantite' => $this->quantite,
            'prix_unitaire' => round($this->prix_unitaire, 2),
            'montant_ht' => round($this->montant_ht, 2),
        ];
    }
}
