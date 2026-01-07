<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $montantPaye = $this->whenLoaded('paiements', fn() => $this->paiements->sum('montant'), 0);
        
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'date' => $this->date?->toDateString(),
            'date_echeance' => $this->date_echeance?->toDateString(),
            'type_document' => $this->type_document,
            'statut' => $this->statut,
            
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
            
            // Paiements
            'montant_paye' => $this->when($this->montant_paye !== null, round($this->montant_paye, 2)),
            'reste_a_payer' => $this->when($this->reste_a_payer !== null, round($this->reste_a_payer, 2)),
            'jours_retard' => $this->when($this->jours_retard !== null, $this->jours_retard),
            
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations
            'client' => new ClientResource($this->whenLoaded('client')),
            'transitaire' => new TransitaireResource($this->whenLoaded('transitaire')),
            'ordre_travail' => new OrdreTravailResource($this->whenLoaded('ordreTravail')),
            'lignes' => LigneFactureResource::collection($this->whenLoaded('lignes')),
            'conteneurs' => ConteneurFactureResource::collection($this->whenLoaded('conteneurs')),
            'lots' => LotFactureResource::collection($this->whenLoaded('lots')),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
        ];
    }
}
