<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class DevisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Parsing sécurisé des dates
        $dateCreation = $this->parseDate($this->date_creation);
        $dateValidite = $this->parseDate($this->date_validite);

        // Calcul validité en jours
        $validiteJours = null;
        if ($dateCreation && $dateValidite) {
            try {
                $validiteJours = max(1, (int) $dateCreation->diffInDays($dateValidite));
            } catch (\Exception $e) {
                $validiteJours = null;
            }
        }

        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'date' => $dateCreation?->toDateString(),
            'date_creation' => $dateCreation?->toDateString(),
            'date_validite' => $dateValidite?->toDateString(),

            // Catégorie et type
            'categorie' => $this->categorie,
            'type_document' => match ($this->categorie) {
                'conteneurs' => 'Conteneur',
                'conventionnel' => 'Lot',
                'operations_independantes' => 'Independant',
                default => $this->categorie,
            },
            'type_operation' => $this->type_operation,
            'type_operation_indep' => $this->type_operation_indep,
            'statut' => $this->statut,
            'validite_jours' => $validiteJours,
            'date_expiration' => $dateValidite?->toDateString(),

            // Informations navire
            'bl_numero' => $this->numero_bl,
            'numero_bl' => $this->numero_bl,
            'navire' => $this->navire,

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

    /**
     * Parser une date de façon sécurisée
     */
    private function parseDate($value): ?Carbon
    {
        if (!$value) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
