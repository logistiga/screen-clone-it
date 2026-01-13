<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RepresentantResource extends JsonResource
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

        // Nom complet sans espace inutile si prenom est null
        $nomComplet = trim("{$this->nom} {$this->prenom}");

        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'nom_complet' => $nomComplet,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'taux_commission' => $this->taux_commission,
            'actif' => $this->actif,
            'created_at' => $this->created_at?->toISOString(),
            
            // Totaux calculés des primes (SQL ou mémoire)
            'primes_dues' => round($primesDues, 2),
            'primes_payees' => round($primesPayees, 2),
            
            // Compteurs
            'counts' => $this->when($this->primes_count !== null, [
                'primes' => $this->primes_count ?? 0,
            ]),
            
            // Sommes (total général)
            'totaux' => $this->when($this->primes_total !== null, [
                'total_primes' => round((float) ($this->primes_total ?? 0), 2),
            ]),
            
            // Stats calculées (si définies)
            'stats' => $this->when($this->stats !== null, $this->stats),
            
            // Relations
            'primes' => PrimeResource::collection($this->whenLoaded('primes')),
            'paiements_primes' => PaiementPrimeResource::collection($this->whenLoaded('paiementsPrimes')),
            'ordres_travail' => OrdreTravailResource::collection($this->whenLoaded('ordres')),
            'factures' => FactureResource::collection($this->whenLoaded('factures')),
            'devis' => DevisResource::collection($this->whenLoaded('devis')),
        ];
    }
}
