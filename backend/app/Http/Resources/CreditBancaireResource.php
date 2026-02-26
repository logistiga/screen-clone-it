<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CreditBancaireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $montantEmprunte = (float) ($this->montant_emprunte ?? 0);
        $totalInterets = (float) ($this->total_interets ?? 0);
        $montantRembourse = (float) ($this->montant_rembourse ?? 0);

        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'objet' => $this->objet,
            'montant_principal' => round($montantEmprunte, 2),
            'taux_interet' => (float) $this->taux_interet,
            'montant_interet' => round($totalInterets, 2),
            'montant_total' => round($montantEmprunte + $totalInterets, 2),
            'duree_mois' => $this->duree_en_mois,
            'date_debut' => $this->date_debut?->toDateString(),
            'date_fin' => $this->date_fin?->toDateString(),
            'statut' => $this->statut,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            
            // Remboursements
            'montant_rembourse' => round($montantRembourse, 2),
            'reste_a_payer' => round(($montantEmprunte + $totalInterets) - $montantRembourse, 2),
            
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
