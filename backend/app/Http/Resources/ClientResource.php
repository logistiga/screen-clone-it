<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Solde calculé dynamiquement si les agrégats sont présents (via withSum)
        $soldeDynamique = null;
        if ($this->factures_sum_ttc !== null && $this->paiements_sum_montant !== null) {
            $soldeDynamique = (float) ($this->factures_sum_ttc - $this->paiements_sum_montant);
        }
        
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
            'solde' => (float) ($soldeDynamique ?? $this->solde ?? 0),
            'solde_avoirs' => (float) ($this->solde_avoirs ?? 0), // Via subquery, plus de N+1
            'limite_credit' => (float) ($this->limite_credit ?? 0),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations (chargées uniquement si demandées via with())
            'devis' => DevisResource::collection($this->whenLoaded('devis')),
            'ordres_travail' => OrdreTravailResource::collection($this->whenLoaded('ordresTravail')),
            'factures' => FactureResource::collection($this->whenLoaded('factures')),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
            'contacts' => ContactResource::collection($this->whenLoaded('contacts')),
            
            // Statistiques calculées (mode détail)
            'stats' => $this->when($this->total_facture !== null, [
                'total_facture' => $this->total_facture,
                'total_paye' => $this->total_paye,
                'solde' => $this->solde,
            ]),
            
            // Compteurs (via withCount)
            'counts' => $this->when($this->devis_count !== null || $this->factures_count !== null, [
                'devis' => $this->devis_count ?? 0,
                'ordres' => $this->ordres_travail_count ?? 0,
                'factures' => $this->factures_count ?? 0,
            ]),
        ];
    }
}
