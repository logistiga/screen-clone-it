<?php

namespace App\Services\Facture;

use App\Models\Facture;
use App\Models\Configuration;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les factures de type Conventionnel (Lots).
 * Gère la création, modification et calcul des totaux pour les marchandises en vrac.
 */
class FactureConventionnelService
{
    /**
     * Valider les données spécifiques aux lots
     */
    public function validerDonnees(array $data): array
    {
        $errors = [];
        
        if (empty($data['lots']) || !is_array($data['lots'])) {
            $errors[] = 'Au moins un lot est requis';
        } else {
            foreach ($data['lots'] as $index => $lot) {
                if (empty($lot['designation']) && empty($lot['description'])) {
                    $errors[] = "Lot #{$index}: désignation ou description requise";
                }
            }
        }
        
        return $errors;
    }

    /**
     * Créer les lots d'une facture
     */
    public function creerLots(Facture $facture, array $lots): void
    {
        foreach (array_values($lots) as $i => $lot) {
            $lot = $this->normaliserLot($lot, $i);
            $facture->lots()->create($lot);
        }
    }

    /**
     * Calculer le total HT des lots
     */
    public function calculerTotalHT(Facture $facture): float
    {
        $total = 0;
        
        foreach ($facture->lots as $lot) {
            $total += ($lot->quantite ?? 1) * ($lot->prix_unitaire ?? 0);
        }
        
        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour la facture
     */
    public function calculerTotaux(Facture $facture): void
    {
        // Recharger les lots
        $facture->load('lots');
        
        $montantHT = $this->calculerTotalHT($facture);
        
        // Récupérer les taux depuis la configuration taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;
        
        // Appliquer taxes selon catégorie
        if ($facture->categorie === 'non_assujetti') {
            $montantTVA = 0;
            $montantCSS = 0;
        } else {
            $montantTVA = $montantHT * ($tauxTVA / 100);
            $montantCSS = $montantHT * ($tauxCSS / 100);
        }
        
        $montantTTC = $montantHT + $montantTVA + $montantCSS;
        
        $facture->update([
            'montant_ht' => $montantHT,
            'montant_tva' => $montantTVA,
            'montant_css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
        
        Log::info('Totaux conventionnel facture calculés', [
            'facture_id' => $facture->id,
            'nb_lots' => $facture->lots->count(),
            'montant_ht' => $montantHT,
        ]);
    }

    /**
     * Normaliser les données d'un lot depuis l'API
     */
    protected function normaliserLot(array $data, int $index): array
    {
        // API envoie designation, DB utilise description
        if (isset($data['designation']) && !isset($data['description'])) {
            $data['description'] = $data['designation'];
        }
        unset($data['designation']);
        
        // Générer un numéro de lot si absent
        if (empty($data['numero_lot'])) {
            $data['numero_lot'] = 'LOT-' . ($index + 1);
        }
        
        // Valeurs par défaut
        $data['quantite'] = $data['quantite'] ?? 1;
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        
        return $data;
    }
}
