<?php

namespace App\Services\Devis;

use App\Models\Devis;
use App\Models\Configuration;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les devis de type Conventionnel (Lots).
 * Gère la création, modification et calcul des totaux pour les marchandises en vrac.
 */
class DevisConventionnelService
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
     * Créer les lots d'un devis
     */
    public function creerLots(Devis $devis, array $lots): void
    {
        foreach (array_values($lots) as $i => $lot) {
            $lot = $this->normaliserLot($lot, $i);
            $devis->lots()->create($lot);
        }
    }

    /**
     * Calculer le total HT des lots
     */
    public function calculerTotalHT(Devis $devis): float
    {
        $total = 0;
        
        foreach ($devis->lots as $lot) {
            $total += $lot->quantite * $lot->prix_unitaire;
        }
        
        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour le devis
     */
    public function calculerTotaux(Devis $devis): void
    {
        // Recharger les lots
        $devis->load('lots');
        
        $montantHT = $this->calculerTotalHT($devis);
        
        // Récupérer les taux depuis la configuration taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;
        
        $montantTVA = $montantHT * ($tauxTVA / 100);
        $montantCSS = $montantHT * ($tauxCSS / 100);
        $montantTTC = $montantHT + $montantTVA + $montantCSS;
        
        $devis->update([
            'montant_ht' => $montantHT,
            'tva' => $montantTVA,
            'css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
        
        Log::info('Totaux conventionnel calculés', [
            'devis_id' => $devis->id,
            'nb_lots' => $devis->lots->count(),
            'montant_ht' => $montantHT,
        ]);
    }

    /**
     * Préparer les données pour conversion en ordre de travail
     */
    public function preparerPourConversion(Devis $devis): array
    {
        return [
            'lots' => $devis->lots->map(function ($lot) {
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
