<?php

namespace App\Http\Resources;

use App\Models\Annulation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Calculer le solde des avoirs disponibles pour ce client
        $soldeAvoirs = $this->getSoldeAvoirs();
        
        return [
            'id' => (string) $this->id,
            'nom' => $this->nom,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'pays' => $this->pays ?? 'Gabon',
            'type' => $this->type ?? 'Entreprise',
            'nif' => $this->nif,
            'rccm' => $this->rccm,
            'contact_principal' => $this->contact_principal,
            'solde' => (float) ($this->solde ?? 0),
            'solde_avoirs' => (float) $soldeAvoirs,
            'limite_credit' => (float) ($this->limite_credit ?? 0),
            'notes' => $this->notes,
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
    
    /**
     * Calculer le solde total des avoirs disponibles pour ce client
     */
    private function getSoldeAvoirs(): float
    {
        return Annulation::where('client_id', $this->id)
            ->where('generer_avoir', true)
            ->where('solde_avoir', '>', 0)
            ->sum('solde_avoir');
    }
}
