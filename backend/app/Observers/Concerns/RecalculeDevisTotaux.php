<?php

namespace App\Observers\Concerns;

use App\Models\Devis;
use App\Services\Devis\DevisServiceFactory;
use App\Support\DocumentCategory;

trait RecalculeDevisTotaux
{
    protected function recalculerDevis(?Devis $devis): void
    {
        if (!$devis) return;
        try {
            $categorie = DocumentCategory::normalize($devis->categorie);
            $service = app(DevisServiceFactory::class)->getService($categorie);
            $service->calculerTotaux($devis->fresh(['conteneurs.operations', 'lots', 'lignes']));
        } catch (\Throwable $e) {
            \Log::warning('Recalcul auto Devis échoué', [
                'devis_id' => $devis->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
