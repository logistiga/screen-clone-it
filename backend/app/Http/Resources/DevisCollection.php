<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class DevisCollection extends ResourceCollection
{
    public $collects = DevisResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'summary' => $this->calculateSummary(),
        ];
    }

    public function with(Request $request): array
    {
        return [
            'meta' => [
                'generated_at' => now()->toISOString(),
                'currency' => 'FCFA',
            ],
        ];
    }

    protected function calculateSummary(): array
    {
        $collection = $this->collection;

        return [
            'count' => $collection->count(),
            'total_ht' => round($collection->sum(fn($d) => $d->montant_ht ?? 0), 2),
            'total_ttc' => round($collection->sum(fn($d) => $d->montant_ttc ?? 0), 2),
            'par_statut' => $collection->groupBy('statut')->map->count(),
            'par_categorie' => $collection->groupBy('categorie')->map->count(),
            'taux_conversion' => $this->calculateConversionRate($collection),
        ];
    }

    protected function calculateConversionRate($collection): float
    {
        $total = $collection->count();
        if ($total === 0) return 0;

        $convertis = $collection->filter(fn($d) => 
            in_array($d->statut, ['accepte', 'converti'])
        )->count();

        return round(($convertis / $total) * 100, 1);
    }
}
