<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransitaireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Priorité: colonnes SQL (index rapide) sinon calcul en mémoire (show détaillé)
        $primesDues = $this->relationLoaded('primes')
            ? $this->primes->whereIn('statut', ['En attente', 'Partiellement payée'])->sum('montant')
            : (float) ($this->primes_dues ?? 0);
        
        $primesPayees = $this->relationLoaded('primes')
            ? $this->primes->where('statut', 'Payée')->sum('montant')
            : (float) ($this->primes_payees ?? 0);
        
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
            
            // Stats primes (SQL ou mémoire) avec round() pour cohérence
            'primes_dues' => round($primesDues, 2),
            'primes_payees' => round($primesPayees, 2),
            
            // Relations
            'devis' => DevisResource::collection($this->whenLoaded('devis')),
            'ordres_travail' => OrdreTravailResource::collection($this->whenLoaded('ordresTravail')),
            'factures' => FactureResource::collection($this->whenLoaded('factures')),
            'primes' => PrimeResource::collection($this->whenLoaded('primes')),
            'paiements_primes' => PaiementPrimeResource::collection($this->whenLoaded('paiementsPrimes')),
        ];
    }
}
