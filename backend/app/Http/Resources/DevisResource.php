<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DevisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Parsing sécurisé des dates (évite Call to a member function on string)
        $dc = $this->date_creation 
            ? ($this->date_creation instanceof \Carbon\Carbon 
                ? $this->date_creation 
                : \Carbon\Carbon::parse($this->date_creation)) 
            : null;
        
        $dv = $this->date_validite 
            ? ($this->date_validite instanceof \Carbon\Carbon 
                ? $this->date_validite 
                : \Carbon\Carbon::parse($this->date_validite)) 
            : null;
        
        // Calcul validité en jours
        $validiteJours = null;
        if ($dc && $dv) {
            try {
                $validiteJours = max(1, (int) $dc->diffInDays($dv));
            } catch (\Exception $e) {
                $validiteJours = null;
            }
        }

        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'date' => $dc?->toDateString(),
            'date_creation' => $dc?->toDateString(),
            'date_validite' => $dv?->toDateString(),

            // Catégorie et type
            'categorie' => $this->categorie,
            'type_document' => match($this->categorie) {
                'conteneurs' => 'Conteneur',
                'conventionnel' => 'Lot',
                'operations_independantes' => 'Independant',
                default => $this->categorie,
            },
            'type_operation' => $this->type_operation,
            'type_operation_indep' => $this->type_operation_indep,
            'statut' => $this->statut,
            'validite_jours' => $validiteJours,
            'date_expiration' => $dv?->toDateString(),

            // Informations navire
            'bl_numero' => $this->numero_bl,
            'numero_bl' => $this->numero_bl,
            'navire' => $this->navire,
            'date_arrivee' => null,

            // IDs partenaires
            'client_id' => $this->client_id,
            'armateur_id' => $this->armateur_id,
            'transitaire_id' => $this->transitaire_id,
            'representant_id' => $this->representant_id,

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
            'armateur' => new ArmateurResource($this->whenLoaded('armateur')),
            'transitaire' => new TransitaireResource($this->whenLoaded('transitaire')),
            'representant' => new RepresentantResource($this->whenLoaded('representant')),
            'lignes' => LigneDevisResource::collection($this->whenLoaded('lignes')),
            'conteneurs' => ConteneurDevisResource::collection($this->whenLoaded('conteneurs')),
            'lots' => LotDevisResource::collection($this->whenLoaded('lots')),
        ];
    }
}
