<?php

namespace App\Traits;

use App\Models\Configuration;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Facture;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Trait partagé pour le calcul des totaux (HT, TVA, CSS, TTC) avec remise.
 * Utilisé par les services Devis, OrdreTravail et Facture.
 */
trait CalculeTotauxTrait
{
    /**
     * Récupérer la configuration des taxes avec mise en cache (5 minutes).
     * Évite les requêtes répétées à la base de données.
     */
    /**
     * Récupérer la configuration des taxes depuis la table taxes.
     * Lit les taux directement depuis Taxe::active() pour synchronisation avec la gestion des taxes.
     */
    protected function getTaxesConfig(): array
    {
        return Cache::remember('taxes_config', 300, function () {
            // Vérifier si la table taxes existe
            if (!\Illuminate\Support\Facades\Schema::hasTable('taxes')) {
                Log::info("Table taxes non disponible, utilisation des valeurs par défaut");
                return [
                    'tva_taux' => 18,
                    'css_taux' => 1,
                    'tva_actif' => true,
                    'css_actif' => true,
                ];
            }
            
            // Récupérer les taxes actives depuis la table taxes
            $taxesActives = \App\Models\Taxe::active()->get();
            
            $taxes = [];
            foreach ($taxesActives as $taxe) {
                $code = strtolower($taxe->code);
                $taxes[$code . '_taux'] = $taxe->taux;
                $taxes[$code . '_actif'] = $taxe->active;
            }
            
            // Retourner les taux avec valeurs par défaut si non trouvées
            return [
                'tva_taux' => $taxes['tva_taux'] ?? 18,
                'css_taux' => $taxes['css_taux'] ?? 1,
                'tva_actif' => $taxes['tva_actif'] ?? true,
                'css_actif' => $taxes['css_actif'] ?? true,
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
     * Appliquer le calcul complet des totaux sur un document (Devis, Ordre ou Facture).
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

        // Calculer les taxes
        $taxes = $this->calculerTaxes($montantHTApresRemise, $document->categorie ?? null);

        // Appliquer les exonérations sélectives
        if ($document->exonere_tva ?? false) {
            $taxes['tva'] = 0;
        }
        if ($document->exonere_css ?? false) {
            $taxes['css'] = 0;
        }

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
