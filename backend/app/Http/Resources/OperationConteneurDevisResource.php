<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OperationConteneurDevisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'type_operation' => $this->type,
            'description' => $this->description,
            'quantite' => (float) $this->quantite,
            'prix_unitaire' => round((float) $this->prix_unitaire, 2),
            'prixUnitaire' => round((float) $this->prix_unitaire, 2),
            'montant_ht' => round((float) ($this->prix_total ?? ($this->quantite * $this->prix_unitaire)), 2),
            'prix_total' => round((float) ($this->prix_total ?? ($this->quantite * $this->prix_unitaire)), 2),
        ];
    }
}
