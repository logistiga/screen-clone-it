<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class FactureCollection extends ResourceCollection
{
    public $collects = FactureResource::class;

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

        $totalHT = $collection->sum(fn($f) => $f->montant_ht ?? 0);
        $totalTTC = $collection->sum(fn($f) => $f->montant_ttc ?? 0);
        $totalPaye = $collection->sum(fn($f) => $f->montant_paye ?? 0);

        return [
            'count' => $collection->count(),
            'total_ht' => round($totalHT, 2),
            'total_ttc' => round($totalTTC, 2),
            'total_paye' => round($totalPaye, 2),
            'reste_a_payer' => round($totalTTC - $totalPaye, 2),
            'par_statut' => $collection->groupBy('statut')->map->count(),
        ];
    }
}
