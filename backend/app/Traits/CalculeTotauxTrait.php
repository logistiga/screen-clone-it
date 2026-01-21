<?php

namespace App\Traits;

use App\Models\Configuration;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Facture;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Trait partagé pour le calcul des totaux (HT, taxes dynamiques, TTC) avec remise.
 * Supporte la nouvelle structure taxes_selection pour sélection/exonération par taxe.
 */
trait CalculeTotauxTrait
{
    /**
     * Récupérer toutes les taxes actives depuis la table taxes.
     * Retourne un tableau indexé par code.
     */
    protected function getAllActiveTaxes(): array
    {
        return Cache::remember('all_active_taxes', 300, function () {
            if (!Schema::hasTable('taxes')) {
                Log::info("Table taxes non disponible, utilisation des valeurs par défaut");
                return [
                    'TVA' => ['code' => 'TVA', 'nom' => 'TVA', 'taux' => 18, 'active' => true, 'obligatoire' => true],
                    'CSS' => ['code' => 'CSS', 'nom' => 'CSS', 'taux' => 1, 'active' => true, 'obligatoire' => true],
                ];
            }
            
            $taxesActives = \App\Models\Taxe::active()->get();
            $result = [];
            
            foreach ($taxesActives as $taxe) {
                $result[$taxe->code] = [
                    'code' => $taxe->code,
                    'nom' => $taxe->nom,
                    'taux' => (float) $taxe->taux,
                    'active' => (bool) $taxe->active,
                    'obligatoire' => (bool) ($taxe->obligatoire ?? false),
                ];
            }
            
            // Fallback si aucune taxe
            if (empty($result)) {
                return [
                    'TVA' => ['code' => 'TVA', 'nom' => 'TVA', 'taux' => 18, 'active' => true, 'obligatoire' => true],
                    'CSS' => ['code' => 'CSS', 'nom' => 'CSS', 'taux' => 1, 'active' => true, 'obligatoire' => true],
                ];
            }
            
            return $result;
        });
    }

    /**
     * Récupérer la configuration des taxes (rétrocompatibilité).
     */
    protected function getTaxesConfig(): array
    {
        $allTaxes = $this->getAllActiveTaxes();
        
        return [
            'tva_taux' => $allTaxes['TVA']['taux'] ?? 18,
            'css_taux' => $allTaxes['CSS']['taux'] ?? 1,
            'tva_actif' => $allTaxes['TVA']['active'] ?? true,
            'css_actif' => $allTaxes['CSS']['active'] ?? true,
        ];
    }

    /**
     * Calculer le montant de la remise en fonction du type et de la valeur.
     */
    protected function calculerMontantRemise(float $montantHTBrut, ?string $remiseType, float $remiseValeur): float
    {
        if (empty($remiseType) || $remiseType === 'none') {
            return 0;
        }

        if ($remiseValeur <= 0) {
            return 0;
        }

        if ($remiseType === 'pourcentage') {
            $pourcentage = min($remiseValeur, 100);
            return $montantHTBrut * ($pourcentage / 100);
        }

        return min($remiseValeur, $montantHTBrut);
    }

    /**
     * Calculer les taxes dynamiquement depuis taxes_selection.
     * 
     * @param float $montantHTApresRemise Montant HT après remise
     * @param array|null $taxesSelection La structure taxes_selection du document
     * @param string|null $categorie Catégorie du document (pour non_assujetti)
     * @return array ['details' => [...], 'tva' => x, 'css' => x, 'total' => y]
     */
    protected function calculerTaxesDynamiques(
        float $montantHTApresRemise,
        ?array $taxesSelection = null,
        ?string $categorie = null
    ): array {
        // Catégorie non assujettie = pas de taxes
        if ($categorie === 'non_assujetti') {
            return [
                'details' => [],
                'tva' => 0,
                'css' => 0,
                'total' => 0,
            ];
        }

        $allTaxes = $this->getAllActiveTaxes();
        $details = [];
        $total = 0;
        
        // Extraire les données de taxes_selection
        $selectedCodes = $taxesSelection['selected_tax_codes'] ?? array_keys($allTaxes);
        $hasExoneration = $taxesSelection['has_exoneration'] ?? false;
        $exoneratedCodes = $taxesSelection['exonerated_tax_codes'] ?? [];
        
        // Calculer chaque taxe sélectionnée
        foreach ($allTaxes as $code => $taxe) {
            if (!in_array($code, $selectedCodes)) {
                continue; // Taxe non sélectionnée
            }
            
            $isExonerated = $hasExoneration && in_array($code, $exoneratedCodes);
            $montant = $isExonerated ? 0 : round($montantHTApresRemise * ($taxe['taux'] / 100), 2);
            
            $details[$code] = [
                'taux' => $taxe['taux'],
                'montant' => $montant,
                'exonere' => $isExonerated,
            ];
            
            $total += $montant;
        }
        
        // Rétrocompatibilité: extraire TVA et CSS pour les colonnes legacy
        $tva = $details['TVA']['montant'] ?? 0;
        $css = $details['CSS']['montant'] ?? 0;

        return [
            'details' => $details,
            'tva' => $tva,
            'css' => $css,
            'total' => $total,
        ];
    }

    /**
     * Calculer les taxes (rétrocompatibilité avec ancien système).
     */
    protected function calculerTaxes(float $montantHTApresRemise, ?string $categorie = null): array
    {
        $result = $this->calculerTaxesDynamiques($montantHTApresRemise, null, $categorie);
        return [
            'tva' => $result['tva'],
            'css' => $result['css'],
        ];
    }

    /**
     * Appliquer le calcul complet des totaux sur un document (Devis, Ordre ou Facture).
     * Supporte la nouvelle structure taxes_selection pour calcul dynamique.
     * 
     * @param Devis|OrdreTravail|Facture $document Le document à mettre à jour
     * @param float $montantHTBrut Le montant HT brut avant remise
     * @param string $context Contexte pour les logs (ex: 'conteneurs', 'lots')
     */
    protected function appliquerTotaux($document, float $montantHTBrut, string $context = 'document'): void
    {
        // Calculer la remise
        $remiseMontant = $this->calculerMontantRemise(
            $montantHTBrut,
            $document->remise_type,
            (float) ($document->remise_valeur ?? 0)
        );

        // Mettre à jour remise_montant si différent
        if (round($remiseMontant, 2) !== round((float) ($document->remise_montant ?? 0), 2)) {
            $document->remise_montant = round($remiseMontant, 2);
        }

        // Montant HT après remise
        $montantHTApresRemise = max(0, $montantHTBrut - $remiseMontant);

        // Utiliser taxes_selection si disponible, sinon fallback sur exonere_tva/exonere_css
        $taxesSelection = $document->taxes_selection;
        
        if (empty($taxesSelection)) {
            // Fallback: construire taxes_selection depuis les anciennes colonnes
            $taxesSelection = $this->buildTaxesSelectionFromLegacy($document);
        }

        // Calculer les taxes dynamiquement
        $taxes = $this->calculerTaxesDynamiques(
            $montantHTApresRemise,
            $taxesSelection,
            $document->categorie ?? null
        );

        // Calculer le TTC
        $montantTTC = $montantHTApresRemise + $taxes['total'];

        // Mettre à jour le document (colonnes legacy + nouveau)
        $updateData = [
            'montant_ht' => round($montantHTBrut, 2),
            'remise_montant' => round($remiseMontant, 2),
            'tva' => round($taxes['tva'], 2),
            'css' => round($taxes['css'], 2),
            'montant_ttc' => round($montantTTC, 2),
        ];
        
        // Synchroniser exonere_tva/exonere_css depuis taxes_selection pour rétrocompatibilité
        if (!empty($taxesSelection)) {
            $hasExo = $taxesSelection['has_exoneration'] ?? false;
            $exoCodes = $taxesSelection['exonerated_tax_codes'] ?? [];
            $updateData['exonere_tva'] = $hasExo && in_array('TVA', $exoCodes);
            $updateData['exonere_css'] = $hasExo && in_array('CSS', $exoCodes);
            $updateData['motif_exoneration'] = $taxesSelection['motif_exoneration'] ?? null;
        }
        
        $document->update($updateData);

        Log::info("Totaux {$context} calculés (dynamique)", [
            'document_id' => $document->id,
            'document_type' => class_basename($document),
            'montant_ht_brut' => $montantHTBrut,
            'remise_montant' => $remiseMontant,
            'montant_ht_net' => $montantHTApresRemise,
            'taxes_details' => $taxes['details'],
            'taxes_total' => $taxes['total'],
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Construire taxes_selection depuis les anciennes colonnes (rétrocompatibilité).
     */
    protected function buildTaxesSelectionFromLegacy($document): array
    {
        $exoneratedCodes = [];
        
        if ($document->exonere_tva ?? false) {
            $exoneratedCodes[] = 'TVA';
        }
        if ($document->exonere_css ?? false) {
            $exoneratedCodes[] = 'CSS';
        }
        
        $hasExoneration = !empty($exoneratedCodes);
        
        return [
            'selected_tax_codes' => ['TVA', 'CSS'],
            'has_exoneration' => $hasExoneration,
            'exonerated_tax_codes' => $exoneratedCodes,
            'motif_exoneration' => $document->motif_exoneration ?? '',
        ];
    }

    /**
     * Invalider le cache des taxes (à appeler lors de la modification de la configuration).
     */
    public static function invaliderCacheTaxes(): void
    {
        Cache::forget('taxes_config');
        Cache::forget('all_active_taxes');
    }
}
