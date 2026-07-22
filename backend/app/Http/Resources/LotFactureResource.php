<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LotFactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $qte = (float) ($this->quantite ?? 1);
        $pu = (float) ($this->prix_unitaire ?? 0);
        $calcule = $qte * $pu;
        $stocke = (float) ($this->prix_total ?? 0);
        $prixTotal = $stocke > 0 ? $stocke : $calcule;
        $texte = trim((string) ($this->description ?? ''));

        return [
            'id' => $this->id,
            'numero_lot' => $this->numero_lot,
            'designation' => $texte,
            'description' => $texte,
            'quantite' => $this->quantite,
            'poids' => $this->poids ?? null,
            'volume' => $this->volume ?? null,
            'prix_unitaire' => round($pu, 2),
            'prix_total' => round($prixTotal, 2),
            'montant_ht' => round($prixTotal, 2),
        ];
    }
}
