<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'date' => $this->date?->toDateString(),
            'date_facture' => $this->date?->toDateString(),
            'date_creation' => $this->date?->toDateString(),
            'date_echeance' => $this->date_echeance?->toDateString(),
            'type_document' => $this->type_document,
            'categorie' => $this->categorie,
            'statut' => $this->statut,
            
            // IDs partenaires
            'client_id' => $this->client_id,
            'ordre_id' => $this->ordre_id,
            'armateur_id' => $this->armateur_id,
            'transitaire_id' => $this->transitaire_id,
            'representant_id' => $this->representant_id,
            
            // Informations navire
            'bl_numero' => $this->bl_numero,
            'numero_bl' => $this->bl_numero,
            'navire' => $this->navire,
            'date_arrivee' => $this->date_arrivee?->toDateString(),
            
            // Montants
            'montant_ht' => round((float) $this->montant_ht, 2),
            'montant_tva' => round((float) $this->montant_tva, 2),
            'montant_css' => round((float) $this->montant_css, 2),
            'montant_ttc' => round((float) $this->montant_ttc, 2),
            'montant_paye' => round((float) $this->montant_paye, 2),
            'reste_a_payer' => round((float) ($this->montant_ttc - $this->montant_paye), 2),
            'taux_tva' => $this->taux_tva,
            'taux_css' => $this->taux_css,
            
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations
            'client' => new ClientResource($this->whenLoaded('client')),
            'armateur' => new ArmateurResource($this->whenLoaded('armateur')),
            'transitaire' => new TransitaireResource($this->whenLoaded('transitaire')),
            'representant' => new RepresentantResource($this->whenLoaded('representant')),
            'ordre_travail' => new OrdreTravailResource($this->whenLoaded('ordreTravail')),
            'lignes' => LigneFactureResource::collection($this->whenLoaded('lignes')),
            'conteneurs' => ConteneurFactureResource::collection($this->whenLoaded('conteneurs')),
            'lots' => LotFactureResource::collection($this->whenLoaded('lots')),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
        ];
    }
}
