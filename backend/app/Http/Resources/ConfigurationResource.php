<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConfigurationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cle' => $this->cle,
            'valeur' => $this->valeur,
            'groupe' => $this->groupe,
            'description' => $this->description,
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
