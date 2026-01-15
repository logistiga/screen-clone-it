<?php

namespace App\Traits;

use App\Models\Configuration;
use App\Models\OrdreTravail;
use App\Models\Facture;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Trait partagé pour le calcul des totaux (HT, TVA, CSS, TTC) avec remise.
 * Utilisé par les services OrdreTravail et Facture.
 */
trait CalculeTotauxTrait
{
    /**
     * Récupérer la configuration des taxes avec mise en cache (5 minutes).
     * Évite les requêtes répétées à la base de données.
     */
    protected function getTaxesConfig(): array
    {
        return Cache::remember('taxes_config', 300, function () {
            $config = Configuration::getOrCreate('taxes');
            
            return [
                'tva_taux' => $config->data['tva_taux'] ?? 18,
                'css_taux' => $config->data['css_taux'] ?? 1,
                'tva_actif' => $config->data['tva_actif'] ?? true,
                'css_actif' => $config->data['css_actif'] ?? true,
            ];
        });
    }

    /**
     * Calculer le montant de la remise en fonction du type et de la valeur.
     */
    protected function calculerMontantRemise(float $montantHTBrut, ?string $remiseType, float $remiseValeur): float
    {
        // Pas de remise si type null/none ou valeur <= 0
        if (empty($remiseType) || $remiseType === 'none') {
            return 0;
        }

        if ($remiseValeur <= 0) {
            return 0;
        }

        if ($remiseType === 'pourcentage') {
            // Pourcentage limité à 100%
            $pourcentage = min($remiseValeur, 100);
            return $montantHTBrut * ($pourcentage / 100);
        }

        // Remise en montant fixe - ne peut pas dépasser le montant HT
        return min($remiseValeur, $montantHTBrut);
    }

    /**
     * Calculer les taxes (TVA, CSS) sur un montant donné.
     */
    protected function calculerTaxes(float $montantHTApresRemise, ?string $categorie = null): array
    {
        $config = $this->getTaxesConfig();
        
        // Catégorie non assujettie = pas de taxes
        if ($categorie === 'non_assujetti') {
            return [
                'tva' => 0,
                'css' => 0,
            ];
        }

        $montantTVA = $config['tva_actif'] ? $montantHTApresRemise * ($config['tva_taux'] / 100) : 0;
        $montantCSS = $config['css_actif'] ? $montantHTApresRemise * ($config['css_taux'] / 100) : 0;

        return [
            'tva' => $montantTVA,
            'css' => $montantCSS,
        ];
    }

    /**
     * Appliquer le calcul complet des totaux sur un document (Ordre ou Facture).
     * 
     * @param OrdreTravail|Facture $document Le document à mettre à jour
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

        // Calculer les taxes
        $taxes = $this->calculerTaxes($montantHTApresRemise, $document->categorie ?? null);

        // Calculer le TTC
        $montantTTC = $montantHTApresRemise + $taxes['tva'] + $taxes['css'];

        // Mettre à jour le document
        $document->update([
            'montant_ht' => round($montantHTBrut, 2),
            'remise_montant' => round($remiseMontant, 2),
            'tva' => round($taxes['tva'], 2),
            'css' => round($taxes['css'], 2),
            'montant_ttc' => round($montantTTC, 2),
        ]);

        Log::info("Totaux {$context} calculés", [
            'document_id' => $document->id,
            'document_type' => class_basename($document),
            'montant_ht_brut' => $montantHTBrut,
            'remise_type' => $document->remise_type,
            'remise_valeur' => $document->remise_valeur,
            'remise_montant' => $remiseMontant,
            'montant_ht_net' => $montantHTApresRemise,
            'tva' => $taxes['tva'],
            'css' => $taxes['css'],
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Invalider le cache des taxes (à appeler lors de la modification de la configuration).
     */
    public static function invaliderCacheTaxes(): void
    {
        Cache::forget('taxes_config');
    }
}
