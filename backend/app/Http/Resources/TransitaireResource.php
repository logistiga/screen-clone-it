<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransitaireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Calculer les totaux des primes si chargées
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
            'email' => $this->email,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'contact_principal' => $this->contact_principal,
            'nif' => $this->nif,
            'rccm' => $this->rccm,
            'actif' => $this->actif,
            'created_at' => $this->created_at?->toISOString(),
            
            // Compteurs
            'counts' => $this->when($this->devis_count !== null, [
                'devis' => $this->devis_count ?? 0,
                'ordres' => $this->ordres_travail_count ?? 0,
                'factures' => $this->factures_count ?? 0,
            ]),
            
            // Stats primes
            'primes_dues' => $primesDues,
            'primes_payees' => $primesPayees,
            
            // Relations
            'devis' => DevisResource::collection($this->whenLoaded('devis')),
            'ordres_travail' => OrdreTravailResource::collection($this->whenLoaded('ordresTravail')),
            'factures' => FactureResource::collection($this->whenLoaded('factures')),
            'primes' => PrimeResource::collection($this->whenLoaded('primes')),
            'paiements_primes' => PaiementPrimeResource::collection($this->whenLoaded('paiementsPrimes')),
        ];
    }
}
