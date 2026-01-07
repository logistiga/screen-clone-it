<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CreditBancaireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'objet' => $this->objet,
            'montant_principal' => round($this->montant_principal, 2),
            'taux_interet' => $this->taux_interet,
            'montant_interet' => round($this->montant_interet, 2),
            'montant_total' => round($this->montant_total, 2),
            'duree_mois' => $this->duree_mois,
            'date_debut' => $this->date_debut?->toDateString(),
            'date_fin' => $this->date_fin?->toDateString(),
            'statut' => $this->statut,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            
            // Remboursements
            'montant_rembourse' => $this->when($this->montant_rembourse !== null, round($this->montant_rembourse, 2)),
            'reste_a_payer' => $this->when($this->reste_a_payer !== null, round($this->reste_a_payer, 2)),
            
            // Relations
            'banque' => new BanqueResource($this->whenLoaded('banque')),
            'echeances' => EcheanceCreditResource::collection($this->whenLoaded('echeances')),
            'remboursements' => RemboursementCreditResource::collection($this->whenLoaded('remboursements')),
            'documents' => DocumentCreditResource::collection($this->whenLoaded('documents')),
            'prochaine_echeance' => $this->when($this->prochaine_echeance !== null, 
                new EcheanceCreditResource($this->prochaine_echeance)
            ),
        ];
    }
}
