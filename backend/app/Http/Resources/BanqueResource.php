<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BanqueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'code' => $this->code,
            'adresse' => $this->adresse,
            'telephone' => $this->telephone,
            'email' => $this->email,
            'rib' => $this->rib,
            'iban' => $this->iban,
            'swift' => $this->swift,
            'actif' => $this->actif,
            'created_at' => $this->created_at?->toISOString(),
            
            // Statistiques
            'stats' => $this->when($this->total_paiements !== null || $this->paiements_count !== null, [
                'nombre_paiements' => $this->paiements_count ?? 0,
                'total_paiements' => round($this->paiements_sum_montant ?? 0, 2),
            ]),
        ];
    }
}
