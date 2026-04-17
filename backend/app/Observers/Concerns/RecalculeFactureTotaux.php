<?php

namespace App\Observers\Concerns;

use App\Models\Facture;
use App\Services\Facture\FactureServiceFactory;
use App\Support\DocumentCategory;

trait RecalculeFactureTotaux
{
    protected function recalculerFacture(?Facture $facture): void
    {
        if (!$facture) return;
        try {
            $categorie = DocumentCategory::normalize($facture->categorie);
            $service = app(FactureServiceFactory::class)->getService($categorie);
            $service->calculerTotaux($facture->fresh(['conteneurs.operations', 'lots', 'lignes']));
        } catch (\Throwable $e) {
            \Log::warning('Recalcul auto Facture échoué', [
                'facture_id' => $facture->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
