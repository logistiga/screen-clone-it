<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LotOrdreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero_lot' => $this->numero_lot,
            'designation' => $this->description,
            'description' => $this->description,
            'quantite' => $this->quantite,
            'prix_unitaire' => round($this->prix_unitaire, 2),
            'prix_total' => round($this->prix_total, 2),
            'montant_ht' => round($this->prix_total, 2),
        ];
    }
}
