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
            // IMPORTANT: Charger les relations AVANT la conversion
            $ordre->load(['conteneurs.operations', 'lots', 'lignes']);

            $categorie = DocumentCategory::normalize($ordre->categorie);
            $service = $this->getService($categorie);
            $factureFactory = app(FactureServiceFactory::class);

            // Construire taxes_selection avec fallback robuste
            $taxesSelection = $ordre->taxes_selection;
            if (empty($taxesSelection) || !is_array($taxesSelection) || !isset($taxesSelection['selected_tax_codes'])) {
                // Fallback: appliquer TVA + CSS par défaut
                $taxesSelection = [
                    'selected_tax_codes' => ['TVA', 'CSS'],
                    'has_exoneration' => (bool) ($ordre->exonere_tva || $ordre->exonere_css),
                    'exonerated_tax_codes' => array_filter([
                        $ordre->exonere_tva ? 'TVA' : null,
                        $ordre->exonere_css ? 'CSS' : null,
                    ]),
                    'motif_exoneration' => $ordre->motif_exoneration ?? '',
                ];
            }

            $factureData = [
                'client_id' => $ordre->client_id,
                'ordre_id' => $ordre->id,
                'date_creation' => now()->toDateString(),
                'armateur_id' => $ordre->armateur_id,
                'transitaire_id' => $ordre->transitaire_id,
                'representant_id' => $ordre->representant_id,
                'categorie' => $categorie,
                'type_operation' => $ordre->type_operation,
                'type_operation_indep' => $ordre->type_operation_indep,
                'numero_bl' => $ordre->numero_bl,
                'navire' => $ordre->navire,
                'notes' => $ordre->notes,
                'statut' => 'emise',
                'remise_type' => $ordre->remise_type ?? null,
                'remise_valeur' => $ordre->remise_valeur ?? 0,
                'taxes_selection' => $taxesSelection,
                'exonere_tva' => $ordre->exonere_tva ?? false,
                'exonere_css' => $ordre->exonere_css ?? false,
                'motif_exoneration' => $ordre->motif_exoneration ?? null,
            ];

            $conversionData = $service->preparerPourConversion($ordre);
            $factureData = array_merge($factureData, $conversionData);

            Log::info('DEBUG conversion ordre->facture', [
                'ordre_id' => $ordre->id,
                'ordre_numero' => $ordre->numero,
                'categorie' => $categorie,
                'nb_conteneurs' => $ordre->conteneurs->count(),
                'nb_lots' => $ordre->lots->count(),
                'nb_lignes' => $ordre->lignes->count(),
                'conversion_keys' => array_keys($conversionData),
                'conteneurs_count_in_data' => count($factureData['conteneurs'] ?? []),
                'lots_count_in_data' => count($factureData['lots'] ?? []),
                'lignes_count_in_data' => count($factureData['lignes'] ?? []),
            ]);

            $facture = $factureFactory->creer($factureData);
            $ordre->update(['statut' => 'facture']);

            Log::info('Ordre converti en facture OK', [
                'ordre_id' => $ordre->id,
                'facture_id' => $facture->id,
                'facture_numero' => $facture->numero,
                'montant_ht' => $facture->montant_ht,
                'montant_ttc' => $facture->montant_ttc,
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
