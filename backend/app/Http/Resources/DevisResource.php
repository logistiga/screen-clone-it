<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DevisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'date' => $this->date?->toDateString(),
            'type_document' => $this->type_document,
            'statut' => $this->statut,
            'validite_jours' => $this->validite_jours,
            'date_expiration' => $this->date ? $this->date->addDays($this->validite_jours)->toDateString() : null,
            
            // Informations navire
            'bl_numero' => $this->bl_numero,
            'navire' => $this->navire,
            'date_arrivee' => $this->date_arrivee?->toDateString(),
            
            // Montants
            'montant_ht' => round($this->montant_ht, 2),
            'montant_tva' => round($this->montant_tva, 2),
            'montant_css' => round($this->montant_css, 2),
            'montant_ttc' => round($this->montant_ttc, 2),
            'taux_tva' => $this->taux_tva,
            'taux_css' => $this->taux_css,
            
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations
            'client' => new ClientResource($this->whenLoaded('client')),
            'transitaire' => new TransitaireResource($this->whenLoaded('transitaire')),
            'lignes' => LigneDevisResource::collection($this->whenLoaded('lignes')),
            'conteneurs' => ConteneurDevisResource::collection($this->whenLoaded('conteneurs')),
            'lots' => LotDevisResource::collection($this->whenLoaded('lots')),
        ];
    }
}
