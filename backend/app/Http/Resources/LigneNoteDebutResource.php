<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LigneNoteDebutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'note_debut_id' => $this->note_debut_id,
            'ordre_id' => $this->ordre_id,
            
            // Conteneur/Lot
            'conteneur_numero' => $this->conteneur_numero,
            'bl_numero' => $this->bl_numero,
            
            // Période
            'date_debut' => $this->date_debut?->toDateString(),
            'date_fin' => $this->date_fin?->toDateString(),
            'nombre_jours' => $this->nombre_jours,
            
            // Montants
            'tarif_journalier' => round($this->tarif_journalier ?? 0, 2),
            'montant_ht' => round($this->montant_ht ?? 0, 2),
            
            'observations' => $this->observations,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
