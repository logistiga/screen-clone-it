<?php

namespace App\Services\OrdreTravail;

use App\Models\OrdreTravail;
use App\Services\Facture\FactureServiceFactory;
use App\Support\DocumentCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Conversion d'ordres en factures et synchronisation facture ↔ ordre
 */
class OrdreConversionService
{
    protected OrdreConteneursService $conteneursService;
    protected OrdreConventionnelService $conventionnelService;
    protected OrdreIndependantService $independantService;

    public function __construct(
        OrdreConteneursService $conteneursService,
        OrdreConventionnelService $conventionnelService,
        OrdreIndependantService $independantService
    ) {
        $this->conteneursService = $conteneursService;
        $this->conventionnelService = $conventionnelService;
        $this->independantService = $independantService;
    }

    public function getService(string $categorie): OrdreConteneursService|OrdreConventionnelService|OrdreIndependantService
    {
        return match (DocumentCategory::normalize($categorie)) {
            DocumentCategory::CONTENEURS => $this->conteneursService,
            DocumentCategory::CONVENTIONNEL => $this->conventionnelService,
            DocumentCategory::INDEPENDANT => $this->independantService,
            default => $this->conteneursService,
        };
    }

    public function convertirEnFacture(OrdreTravail $ordre): \App\Models\Facture
    {
        return DB::transaction(function () use ($ordre) {
            $categorie = DocumentCategory::normalize($ordre->categorie);
            $service = $this->getService($categorie);
            $factureFactory = app(FactureServiceFactory::class);

            $factureData = [
                'client_id' => $ordre->client_id,
                'ordre_id' => $ordre->id,
                'date_creation' => $ordre->date_creation?->toDateString() ?? now()->toDateString(),
                'armateur_id' => $ordre->armateur_id,
                'transitaire_id' => $ordre->transitaire_id,
                'representant_id' => $ordre->representant_id,
                'categorie' => $categorie,
                'type_operation' => $ordre->type_operation,
                'type_operation_indep' => $ordre->type_operation_indep,
                'numero_bl' => $ordre->numero_bl,
                'navire' => $ordre->navire,
                'notes' => $ordre->notes,
                'statut' => 'brouillon',
            ];

            $factureData = array_merge($factureData, $service->preparerPourConversion($ordre));
            $facture = $factureFactory->creer($factureData);
            $ordre->update(['statut' => 'facture']);

            Log::info('Ordre converti en facture', [
                'ordre_id' => $ordre->id, 'facture_id' => $facture->id, 'categorie' => $categorie,
            ]);

            return $facture;
        });
    }

    public function synchroniserFacture(OrdreTravail $ordre, array $data): void
    {
        $facture = $ordre->facture;
        $factureFactory = app(FactureServiceFactory::class);
        $categorie = DocumentCategory::normalize($ordre->categorie);

        $factureData = [
            'client_id' => $ordre->client_id,
            'armateur_id' => $ordre->armateur_id,
            'transitaire_id' => $ordre->transitaire_id,
            'representant_id' => $ordre->representant_id,
            'type_operation' => $ordre->type_operation,
            'type_operation_indep' => $ordre->type_operation_indep,
            'numero_bl' => $ordre->numero_bl,
            'navire' => $ordre->navire,
            'notes' => $ordre->notes,
        ];

        if (DocumentCategory::isConteneurs($categorie) && isset($data['conteneurs'])) {
            $factureData['conteneurs'] = $data['conteneurs'];
        } elseif (DocumentCategory::isConventionnel($categorie) && isset($data['lots'])) {
            $factureData['lots'] = $data['lots'];
        } elseif (DocumentCategory::isIndependant($categorie) && isset($data['lignes'])) {
            $factureData['lignes'] = $data['lignes'];
        } else {
            $service = $this->getService($categorie);
            $factureData = array_merge($factureData, $service->preparerPourConversion($ordre));
        }

        $factureFactory->modifier($facture, $factureData);

        Log::info('Facture synchronisée avec ordre', [
            'ordre_id' => $ordre->id, 'facture_id' => $facture->id,
        ]);
    }
}
