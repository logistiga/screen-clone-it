<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MouvementCaisseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Extraire le numéro de document et le client depuis le paiement lié
        $documentNumero = null;
        $documentType = null;
        $clientNom = null;

        if ($this->relationLoaded('paiement') && $this->paiement) {
            $paiement = $this->paiement;
            
            if ($paiement->ordre_id && $paiement->relationLoaded('ordre') && $paiement->ordre) {
                $documentNumero = $paiement->ordre->numero;
                $documentType = 'ordre';
                if ($paiement->ordre->relationLoaded('client') && $paiement->ordre->client) {
                    $clientNom = $paiement->ordre->client->nom;
                }
            } elseif ($paiement->facture_id && $paiement->relationLoaded('facture') && $paiement->facture) {
                $documentNumero = $paiement->facture->numero;
                $documentType = 'facture';
                if ($paiement->facture->relationLoaded('client') && $paiement->facture->client) {
                    $clientNom = $paiement->facture->client->nom;
                }
            }
            
            // Client direct sur le paiement
            if (!$clientNom && $paiement->relationLoaded('client') && $paiement->client) {
                $clientNom = $paiement->client->nom;
            }
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'categorie' => $this->categorie,
            'montant' => round((float) $this->montant, 2),
            'description' => $this->description,
            'beneficiaire' => $this->beneficiaire,
            'source' => $this->source,
            'date' => $this->date?->toDateString(),
            'date_mouvement' => $this->date?->toDateString(),
            'created_at' => $this->created_at?->toISOString(),
            
            // Document source
            'document_numero' => $documentNumero,
            'document_type' => $documentType,
            'client_nom' => $clientNom,
            'paiement_id' => $this->paiement_id,
            'banque_id' => $this->banque_id,
            
            // Relations
            'paiement' => new PaiementResource($this->whenLoaded('paiement')),
            'banque' => new BanqueResource($this->whenLoaded('banque')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
