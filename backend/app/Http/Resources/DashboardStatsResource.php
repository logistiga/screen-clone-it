<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardStatsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'clients' => [
                'total' => $this->resource['clients']['total'] ?? 0,
                'nouveaux' => $this->resource['clients']['nouveaux'] ?? 0,
                'variation' => $this->calculateVariation(
                    $this->resource['clients']['total'] ?? 0,
                    $this->resource['clients']['nouveaux'] ?? 0
                ),
            ],
            'devis' => $this->formatDocumentStats($this->resource['devis'] ?? []),
            'ordres' => $this->formatDocumentStats($this->resource['ordres'] ?? []),
            'factures' => $this->formatDocumentStats($this->resource['factures'] ?? []),
            'paiements' => [
                'total_periode' => round((float) ($this->resource['paiements']['total_periode'] ?? 0), 2),
                'par_mode' => $this->resource['paiements']['par_mode'] ?? [],
                'formatted' => $this->formatMontant($this->resource['paiements']['total_periode'] ?? 0),
            ],
            'caisse' => [
                'solde_actuel' => round((float) ($this->resource['caisse']['solde_actuel'] ?? 0), 2),
                'entrees_periode' => round((float) ($this->resource['caisse']['entrees_periode'] ?? 0), 2),
                'sorties_periode' => round((float) ($this->resource['caisse']['sorties_periode'] ?? 0), 2),
                'solde_formatted' => $this->formatMontant($this->resource['caisse']['solde_actuel'] ?? 0),
            ],
            'creances' => [
                'total_impaye' => round((float) ($this->resource['creances']['total_impaye'] ?? 0), 2),
                'factures_en_retard' => $this->resource['creances']['factures_en_retard'] ?? 0,
                'formatted' => $this->formatMontant($this->resource['creances']['total_impaye'] ?? 0),
            ],
            '_meta' => [
                'cached_at' => $this->resource['_cached_at'] ?? null,
                'generated_at' => now()->toISOString(),
            ],
        ];
    }

    protected function formatDocumentStats(array $data): array
    {
        return [
            'total' => $data['total'] ?? 0,
            'periode' => $data['periode'] ?? 0,
            'montant_total' => round((float) ($data['montant_total'] ?? 0), 2),
            'montant_formatted' => $this->formatMontant($data['montant_total'] ?? 0),
            'par_statut' => $data['par_statut'] ?? [],
        ];
    }

    protected function calculateVariation(int $total, int $nouveaux): array
    {
        if ($total === 0) {
            return ['value' => 0, 'trend' => 'stable'];
        }
        
        $percentage = round(($nouveaux / max(1, $total - $nouveaux)) * 100, 1);
        $trend = $percentage > 0 ? 'up' : ($percentage < 0 ? 'down' : 'stable');
        
        return ['value' => abs($percentage), 'trend' => $trend];
    }

    protected function formatMontant(float $montant): string
    {
        if ($montant >= 1000000) {
            return number_format($montant / 1000000, 1, ',', ' ') . ' M FCFA';
        }
        if ($montant >= 1000) {
            return number_format($montant / 1000, 0, ',', ' ') . ' K FCFA';
        }
        return number_format($montant, 0, ',', ' ') . ' FCFA';
    }
}
