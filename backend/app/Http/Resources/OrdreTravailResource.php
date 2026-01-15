<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrdreTravailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'date' => $this->date_creation?->toDateString(),
            'date_creation' => $this->date_creation?->toDateString(),
            'type_document' => match ($this->categorie) {
                'conteneurs' => 'Conteneur',
                'conventionnel' => 'Lot',
                'operations_independantes' => 'Independant',
                default => $this->categorie,
            },
            'categorie' => $this->categorie,
            'type_operation' => $this->type_operation,
            'type_operation_indep' => $this->type_operation_indep,
            'statut' => $this->statut,
            
            // IDs partenaires
            'client_id' => $this->client_id,
            'armateur_id' => $this->armateur_id,
            'transitaire_id' => $this->transitaire_id,
            'representant_id' => $this->representant_id,
            
            // Informations navire
            'bl_numero' => $this->numero_bl,
            'numero_bl' => $this->numero_bl,
            'navire' => $this->navire,
            
            // Montants - utiliser les colonnes de la DB (tva, css)
            'montant_ht' => round((float) $this->montant_ht, 2),
            'montant_tva' => round((float) $this->tva, 2),
            'montant_css' => round((float) $this->css, 2),
            'montant_ttc' => round((float) $this->montant_ttc, 2),
            'montant_paye' => round((float) $this->montant_paye, 2),
            
            // Alias pour compatibilité
            'tva' => round((float) $this->tva, 2),
            'css' => round((float) $this->css, 2),
            'taux_tva' => $this->taux_tva,
            'taux_css' => $this->taux_css,
            
            // Envoi
            'date_envoi' => $this->date_envoi?->toISOString(),
            
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations
            'client' => new ClientResource($this->whenLoaded('client')),
            'armateur' => new ArmateurResource($this->whenLoaded('armateur')),
            'transitaire' => new TransitaireResource($this->whenLoaded('transitaire')),
            'representant' => new RepresentantResource($this->whenLoaded('representant')),
            'devis' => new DevisResource($this->whenLoaded('devis')),
            'facture' => new FactureResource($this->whenLoaded('facture')),
            'lignes' => LigneOrdreResource::collection($this->whenLoaded('lignes')),
            'conteneurs' => ConteneurOrdreResource::collection($this->whenLoaded('conteneurs')),
            'lots' => LotOrdreResource::collection($this->whenLoaded('lots')),
            'primes' => PrimeResource::collection($this->whenLoaded('primes')),
        ];
    }
}
