<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LotDevisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero_lot' => $this->numero_lot,
            'designation' => $this->description ?? $this->designation,
            'description' => $this->description,
            'quantite' => (float) $this->quantite,
            'poids' => $this->poids,
            'volume' => $this->volume,
            'prix_unitaire' => round((float) $this->prix_unitaire, 2),
            'montant_ht' => round((float) ($this->prix_total ?? ($this->quantite * $this->prix_unitaire)), 2),
            'prix_total' => round((float) ($this->prix_total ?? ($this->quantite * $this->prix_unitaire)), 2),
        ];
    }
}
