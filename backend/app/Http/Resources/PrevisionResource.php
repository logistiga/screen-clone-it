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

        $moisNoms = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];

        return [
            'id' => $this->id,
            'type' => $this->type,
            'source' => $this->source,
            'categorie' => $this->categorie,
            'description' => $this->description,
            'montant_prevu' => round($this->montant_prevu, 2),
            'montant_realise' => round($this->montant_realise, 2),
            'ecart' => round($ecart, 2),
            'taux_realisation' => $tauxRealisation,
            'mois' => $this->mois,
            'mois_nom' => $moisNoms[$this->mois] ?? '',
            'annee' => $this->annee,
            'periode' => ($moisNoms[$this->mois] ?? '') . ' ' . $this->annee,
            'date_prevue' => $this->date_prevue?->toDateString(),
            'statut' => $this->statut,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations
            'user' => new UserResource($this->whenLoaded('user')),
            'banque' => new BanqueResource($this->whenLoaded('banque')),
        ];
    }
}
