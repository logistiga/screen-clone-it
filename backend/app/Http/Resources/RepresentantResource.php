<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RepresentantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'nom_complet' => "{$this->nom} {$this->prenom}",
            'email' => $this->email,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'taux_commission' => $this->taux_commission,
            'actif' => $this->actif,
            'created_at' => $this->created_at?->toISOString(),
            
            // Compteurs
            'counts' => $this->when($this->primes_count !== null, [
                'primes' => $this->primes_count ?? 0,
            ]),
            
            // Sommes
            'totaux' => $this->when($this->primes_sum_montant !== null, [
                'total_primes' => round($this->primes_sum_montant ?? 0, 2),
            ]),
            
            // Stats calculées
            'stats' => $this->when($this->stats !== null, $this->stats),
            
            // Relations
            'primes' => PrimeResource::collection($this->whenLoaded('primes')),
        ];
    }
}
