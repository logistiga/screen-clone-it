<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategorieDepenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'description' => $this->description,
            'type' => $this->type,
            'couleur' => $this->couleur,
            'actif' => $this->actif,
            'total_depenses' => $this->when(
                $this->relationLoaded('mouvements') || $request->has('with_stats'),
                fn() => (float) $this->mouvements()->where('type', 'Sortie')->sum('montant')
            ),
            'nombre_mouvements' => $this->when(
                $this->relationLoaded('mouvements') || $request->has('with_stats'),
                fn() => $this->mouvements()->count()
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
