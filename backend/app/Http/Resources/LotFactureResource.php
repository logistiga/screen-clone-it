<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LotFactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'designation' => $this->designation,
            'quantite' => $this->quantite,
            'poids' => $this->poids,
            'volume' => $this->volume,
            'prix_unitaire' => round($this->prix_unitaire, 2),
            'montant_ht' => round($this->montant_ht, 2),
        ];
    }
}
