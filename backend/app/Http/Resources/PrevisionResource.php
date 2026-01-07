<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrevisionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $ecart = $this->montant_realise - $this->montant_prevu;
        $tauxRealisation = $this->montant_prevu > 0 
            ? round(($this->montant_realise / $this->montant_prevu) * 100, 2) 
            : 0;

        return [
            'id' => $this->id,
            'type' => $this->type,
            'categorie' => $this->categorie,
            'description' => $this->description,
            'montant_prevu' => round($this->montant_prevu, 2),
            'montant_realise' => round($this->montant_realise, 2),
            'ecart' => round($ecart, 2),
            'taux_realisation' => $tauxRealisation,
            'mois' => $this->mois,
            'annee' => $this->annee,
            'date_prevue' => $this->date_prevue?->toDateString(),
            'statut' => $this->statut,
            'created_at' => $this->created_at?->toISOString(),
            
            // Relations
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
