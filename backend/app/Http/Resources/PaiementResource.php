<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaiementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Déterminer le document source (ordre prioritaire sur facture)
        $documentNumero = null;
        $documentType = null;
        
        if ($this->ordre_id && $this->relationLoaded('ordre') && $this->ordre) {
            $documentNumero = $this->ordre->numero;
            $documentType = 'ordre';
        } elseif ($this->facture_id && $this->relationLoaded('facture') && $this->facture) {
            $documentNumero = $this->facture->numero;
            $documentType = 'facture';
        }

        return [
            'id' => $this->id,
            'montant' => round((float) $this->montant, 2),
            'mode_paiement' => $this->mode_paiement,
            'reference' => $this->reference,
            'numero_cheque' => $this->numero_cheque,
            'date' => $this->date?->toDateString(),
            'date_paiement' => $this->date?->toDateString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            
            // Document source
            'document_numero' => $documentNumero,
            'document_type' => $documentType,
            'facture_id' => $this->facture_id,
            'ordre_id' => $this->ordre_id,
            'client_id' => $this->client_id,
            'banque_id' => $this->banque_id,
            
            // Relations
            'facture' => new FactureResource($this->whenLoaded('facture')),
            'ordre' => new OrdreTravailResource($this->whenLoaded('ordre')),
            'client' => new ClientResource($this->whenLoaded('client')),
            'banque' => new BanqueResource($this->whenLoaded('banque')),
        ];
    }
}
