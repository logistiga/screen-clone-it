<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LotFactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $prixTotal = $this->prix_total ?? ((float) $this->quantite * (float) $this->prix_unitaire);

        return [
            'id' => $this->id,
            'numero_lot' => $this->numero_lot,
            'designation' => $this->description,
            'description' => $this->description,
            'quantite' => $this->quantite,
            'poids' => $this->poids ?? null,
            'volume' => $this->volume ?? null,
            'prix_unitaire' => round($this->prix_unitaire, 2),
            'prix_total' => round($prixTotal, 2),
            'montant_ht' => round($prixTotal, 2),
        ];
    }
}
