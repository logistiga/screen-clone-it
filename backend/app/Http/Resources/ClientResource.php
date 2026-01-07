<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'type' => $this->type,
            'nif' => $this->nif,
            'rccm' => $this->rccm,
            'contact_principal' => $this->contact_principal,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations
            'devis' => DevisResource::collection($this->whenLoaded('devis')),
            'ordres_travail' => OrdreTravailResource::collection($this->whenLoaded('ordresTravail')),
            'factures' => FactureResource::collection($this->whenLoaded('factures')),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
            
            // Statistiques calculées
            'stats' => $this->when($this->total_facture !== null, [
                'total_facture' => $this->total_facture,
                'total_paye' => $this->total_paye,
                'solde' => $this->solde,
            ]),
            
            // Compteurs
            'counts' => $this->when($this->devis_count !== null || $this->factures_count !== null, [
                'devis' => $this->devis_count ?? 0,
                'ordres' => $this->ordres_travail_count ?? 0,
                'factures' => $this->factures_count ?? 0,
            ]),
        ];
    }
}
