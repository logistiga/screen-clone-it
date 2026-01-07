<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteDebutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'type' => $this->type,
            'date' => $this->date?->toDateString(),
            
            // Informations conteneur
            'bl_numero' => $this->bl_numero,
            'conteneur_numero' => $this->conteneur_numero,
            'conteneur_type' => $this->conteneur_type,
            'conteneur_taille' => $this->conteneur_taille,
            'navire' => $this->navire,
            'date_arrivee' => $this->date_arrivee?->toDateString(),
            
            // Période
            'date_debut' => $this->date_debut?->toDateString(),
            'date_fin' => $this->date_fin?->toDateString(),
            'nombre_jours' => $this->nombre_jours,
            'tarif_journalier' => round($this->tarif_journalier ?? 0, 2),
            
            // Montants
            'montant_ht' => round($this->montant_ht, 2),
            'montant_tva' => round($this->montant_tva, 2),
            'montant_css' => round($this->montant_css, 2),
            'montant_ttc' => round($this->montant_ttc, 2),
            'taux_tva' => $this->taux_tva,
            'taux_css' => $this->taux_css,
            
            'description' => $this->description,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            
            // Relations
            'client' => new ClientResource($this->whenLoaded('client')),
            'transitaire' => new TransitaireResource($this->whenLoaded('transitaire')),
            'armateur' => new ArmateurResource($this->whenLoaded('armateur')),
        ];
    }
}
