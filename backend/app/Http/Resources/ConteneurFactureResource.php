<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConteneurFactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $prixUnitaire = (float) ($this->prix_unitaire ?? 0);
        $totalOps = $this->whenLoaded('operations', fn () => (float) $this->operations->sum('montant_ht'), 0);

        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'type' => $this->type,
            'taille' => $this->taille,
            'description' => $this->description,
            'prix_unitaire' => round($prixUnitaire, 2),
            'armateur' => $this->whenLoaded('armateur', fn() => $this->armateur ? new ArmateurResource($this->armateur) : null),
            'operations' => OperationConteneurFactureResource::collection($this->whenLoaded('operations')),

            // Total HT du conteneur = prix conteneur + total opérations
            'montant_total' => round($prixUnitaire + (float) $totalOps, 2),
        ];
    }
}
