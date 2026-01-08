<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DevisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $dateCreation = $this->date_creation;
        $dateValidite = $this->date_validite;
        $validiteJours = ($dateCreation && $dateValidite)
            ? max(1, (int) $dateCreation->diffInDays($dateValidite))
            : null;

        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'date' => $dateCreation?->toDateString(),
            'date_creation' => $dateCreation?->toDateString(),
            'date_validite' => $dateValidite?->toDateString(),

            // Compat API (frontend)
            'type_document' => null,
            'statut' => $this->statut,
            'validite_jours' => $validiteJours,
            'date_expiration' => $dateValidite?->toDateString(),

            // Informations navire
            'bl_numero' => $this->numero_bl,
            'numero_bl' => $this->numero_bl,
            'navire' => $this->navire,
            'date_arrivee' => null,

            // Montants
            'montant_ht' => round((float) $this->montant_ht, 2),
            'montant_tva' => round((float) $this->tva, 2),
            'montant_css' => round((float) $this->css, 2),
            'montant_ttc' => round((float) $this->montant_ttc, 2),

            // Alias anciens
            'tva' => round((float) $this->tva, 2),
            'css' => round((float) $this->css, 2),

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
