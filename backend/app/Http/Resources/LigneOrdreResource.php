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
            'point_depart' => $this->point_depart,
            'point_arrivee' => $this->point_arrivee,
            'type_transport' => $this->type_transport,
            'mode_trajet' => $this->mode_trajet,
            'materiel' => $this->materiel,
            'nombre_jours' => $this->nombre_jours,
            'date_debut' => $this->date_debut?->toDateString(),
            'date_fin' => $this->date_fin?->toDateString(),
            'quantite' => (float) $this->quantite,
            'prix_unitaire' => round((float) $this->prix_unitaire, 2),
            'montant_ht' => round((float) $this->montant_ht, 2),
        ];
    }
}
