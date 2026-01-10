<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConteneurOrdreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $operationsTotal = $this->operations ? (float) $this->operations->sum('prix_total') : 0.0;
        $montantHT = (float) ($this->prix_unitaire ?? 0) + $operationsTotal;

        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'type' => $this->type,
            'taille' => $this->taille,
            'prix_unitaire' => round((float) ($this->prix_unitaire ?? 0), 2),
            'armateur' => new ArmateurResource($this->whenLoaded('armateur')),
            'operations' => OperationConteneurOrdreResource::collection($this->whenLoaded('operations')),

            // Compat front
            'montant_ht' => round($montantHT, 2),
            'montant_total' => round($montantHT, 2),
        ];
    }
}
