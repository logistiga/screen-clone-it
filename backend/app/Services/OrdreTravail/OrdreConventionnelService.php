<?php

namespace App\Services\OrdreTravail;

use App\Models\OrdreTravail;
use App\Models\Configuration;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les ordres de travail de type Conventionnel (Lots).
 * Gère la création, modification et calcul des totaux pour les marchandises en vrac.
 */
class OrdreConventionnelService
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
     * Créer les lots d'un ordre
     */
    public function creerLots(OrdreTravail $ordre, array $lots): void
    {
        foreach (array_values($lots) as $i => $lot) {
            $lot = $this->normaliserLot($lot, $i);
            $ordre->lots()->create($lot);
        }
    }

    /**
     * Calculer le total HT des lots
     */
    public function calculerTotalHT(OrdreTravail $ordre): float
    {
        $total = 0;
        
        foreach ($ordre->lots as $lot) {
            $total += ($lot->quantite ?? 1) * ($lot->prix_unitaire ?? 0);
        }
        
        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour l'ordre
     */
    public function calculerTotaux(OrdreTravail $ordre): void
    {
        // Recharger les lots
        $ordre->load('lots');
        
        $montantHT = $this->calculerTotalHT($ordre);
        
        // Récupérer les taux depuis la configuration taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;
        
        // Appliquer taxes selon catégorie
        if ($ordre->categorie === 'non_assujetti') {
            $montantTVA = 0;
            $montantCSS = 0;
        } else {
            $montantTVA = $montantHT * ($tauxTVA / 100);
            $montantCSS = $montantHT * ($tauxCSS / 100);
        }
        
        $montantTTC = $montantHT + $montantTVA + $montantCSS;
        
        $ordre->update([
            'montant_ht' => $montantHT,
            'montant_tva' => $montantTVA,
            'montant_css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
        
        Log::info('Totaux conventionnel OT calculés', [
            'ordre_id' => $ordre->id,
            'nb_lots' => $ordre->lots->count(),
            'montant_ht' => $montantHT,
        ]);
    }

    /**
     * Préparer les données pour conversion en facture
     */
    public function preparerPourConversion(OrdreTravail $ordre): array
    {
        return [
            'lots' => $ordre->lots->map(function ($lot) {
                return [
                    'designation' => $lot->description ?? $lot->designation,
                    'numero_lot' => $lot->numero_lot,
                    'quantite' => $lot->quantite,
                    'poids' => $lot->poids,
                    'volume' => $lot->volume,
                    'prix_unitaire' => $lot->prix_unitaire,
                ];
            })->toArray(),
        ];
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
