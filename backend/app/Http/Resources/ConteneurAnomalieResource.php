<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConteneurAnomalieResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'type_label' => $this->getTypeLabel(),
            'numero_conteneur' => $this->numero_conteneur,
            'numero_bl' => $this->numero_bl,
            'client_nom' => $this->client_nom,
            'statut' => $this->statut,
            'details' => $this->details,
            'conteneurs_manquants' => $this->conteneur_manquants,
            'nombre_manquants' => $this->nombre_manquants,
            'ordre_travail' => $this->whenLoaded('ordreTravail', function () {
                return [
                    'id' => $this->ordreTravail->id,
                    'numero' => $this->ordreTravail->numero,
                ];
            }),
            'traite_par' => $this->whenLoaded('traitePar', function () {
                return [
                    'id' => $this->traitePar->id,
                    'name' => $this->traitePar->name,
                ];
            }),
            'traite_at' => $this->traite_at?->toIso8601String(),
            'detected_at' => $this->detected_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function getTypeLabel(): string
    {
        return match($this->type) {
            'oublie' => 'Conteneur oublié',
            'doublon' => 'Doublon détecté',
            'mismatch' => 'Incohérence',
            default => $this->type,
        };
    }
}
