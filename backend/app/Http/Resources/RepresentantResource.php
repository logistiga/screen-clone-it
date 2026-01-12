<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RepresentantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Calculer les primes dues et payées
        $primesDues = 0;
        $primesPayees = 0;
        
        if ($this->relationLoaded('primes')) {
            // Primes dues = montant total des primes non payées
            $primesDues = $this->primes->whereIn('statut', ['En attente', 'Partiellement payée'])->sum('montant');
            // Primes payées = montant total des primes payées
            $primesPayees = $this->primes->where('statut', 'Payée')->sum('montant');
        }

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
            
            // Totaux calculés des primes
            'primes_dues' => round($primesDues, 2),
            'primes_payees' => round($primesPayees, 2),
            
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
            'paiements_primes' => PaiementPrimeResource::collection($this->whenLoaded('paiementsPrimes')),
        ];
    }
}
