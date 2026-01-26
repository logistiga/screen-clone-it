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
            
            // Informations conteneur (pour notes simples)
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
            
            // Montants (AUCUNE taxe sur les notes de début)
            'montant_ht' => round($this->montant_ht, 2),
            'montant_tva' => 0, // Toujours 0 pour notes de début
            'montant_css' => 0, // Toujours 0 pour notes de début
            'montant_ttc' => round($this->montant_ht, 2), // TTC = HT (pas de taxes)
            'taux_tva' => 0,
            'taux_css' => 0,
            
            'description' => $this->description,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            
            // Relations
            'client' => new ClientResource($this->whenLoaded('client')),
            'transitaire' => new TransitaireResource($this->whenLoaded('transitaire')),
            'armateur' => new ArmateurResource($this->whenLoaded('armateur')),
            
            // Lignes (pour notes groupées multi-conteneurs)
            'lignes' => LigneNoteDebutResource::collection($this->whenLoaded('lignes')),
            'nb_lignes' => $this->lignes_count ?? $this->lignes()->count(),
        ];
    }
}
