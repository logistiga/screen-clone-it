<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArmateurResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Priorité: colonnes SQL (index rapide) sinon calcul en mémoire (show détaillé)
        $chiffreAffaires = $this->relationLoaded('factures')
            ? $this->factures->whereNotIn('statut', ['annulee', 'Annulée'])->sum('montant_ttc')
            : (float) ($this->chiffre_affaires ?? 0);
        
        $montantOrdres = $this->relationLoaded('ordres')
            ? $this->ordres->sum('montant_ttc')
            : (float) ($this->montant_ordres ?? 0);

        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'code' => $this->code,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'actif' => $this->actif,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Compteurs (via withCount)
            'counts' => $this->when($this->devis_count !== null, [
                'devis' => $this->devis_count ?? 0,
                'ordres' => $this->ordres_count ?? 0,
                'factures' => $this->factures_count ?? 0,
            ]),
            
            // Stats financières (SQL ou mémoire)
            'chiffre_affaires' => round($chiffreAffaires, 2),
            'montant_ordres' => round($montantOrdres, 2),
            
            // Relations (chargées uniquement si demandées)
            'devis' => DevisResource::collection($this->whenLoaded('devis')),
            'ordres_travail' => OrdreTravailResource::collection($this->whenLoaded('ordres')),
            'factures' => FactureResource::collection($this->whenLoaded('factures')),
        ];
    }
}
