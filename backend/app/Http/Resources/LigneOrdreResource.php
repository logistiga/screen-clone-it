<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LigneOrdreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type_operation' => $this->type_operation,
            'description' => $this->description,
            'lieu_depart' => $this->lieu_depart,
            'lieu_arrivee' => $this->lieu_arrivee,
            'date_debut' => $this->date_debut?->toDateString(),
            'date_fin' => $this->date_fin?->toDateString(),
            'quantite' => $this->quantite,
            'prix_unitaire' => round($this->prix_unitaire, 2),
            'montant_ht' => round($this->montant_ht, 2),
        ];
    }
}
