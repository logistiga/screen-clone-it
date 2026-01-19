<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrevisionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $montantRealise = (float) $this->realise_caisse + (float) $this->realise_banque;
        $ecart = $montantRealise - (float) $this->montant_prevu;
        $tauxRealisation = (float) $this->montant_prevu > 0 
            ? round(($montantRealise / (float) $this->montant_prevu) * 100, 2) 
            : 0;

        $moisNoms = [
            1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
            9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
        ];

        return [
            'id' => $this->id,
            'type' => $this->type,
            'categorie' => $this->categorie,
            'description' => $this->description,
            
            // Montants
            'montant_prevu' => round((float) $this->montant_prevu, 2),
            'realise_caisse' => round((float) $this->realise_caisse, 2),
            'realise_banque' => round((float) $this->realise_banque, 2),
            'montant_realise' => round($montantRealise, 2),
            'ecart' => round($ecart, 2),
            'taux_realisation' => $tauxRealisation,
            
            // Période
            'mois' => $this->mois,
            'mois_nom' => $moisNoms[$this->mois] ?? '',
            'annee' => $this->annee,
            'periode' => ($moisNoms[$this->mois] ?? '') . ' ' . $this->annee,
            
            // Statut
            'statut' => $this->statut,
            'notes' => $this->notes,
            
            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
