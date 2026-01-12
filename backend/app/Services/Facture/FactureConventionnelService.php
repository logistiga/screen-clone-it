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
                    $errors[] = "Lot #" . ($index + 1) . ": désignation ou description requise";
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
        
        // Appliquer la remise si présente
        $remiseMontant = (float) ($facture->remise_montant ?? 0);
        $montantHTApresRemise = max(0, $montantHT - $remiseMontant);
        
        // Récupérer les taux depuis la configuration taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;
        $tvaActif = $taxesConfig->data['tva_actif'] ?? true;
        $cssActif = $taxesConfig->data['css_actif'] ?? true;
        
        // Calculer les taxes sur le montant après remise
        $montantTVA = $tvaActif ? $montantHTApresRemise * ($tauxTVA / 100) : 0;
        $montantCSS = $cssActif ? $montantHTApresRemise * ($tauxCSS / 100) : 0;
        $montantTTC = $montantHTApresRemise + $montantTVA + $montantCSS;
        
        // Utiliser les bons noms de colonnes (tva, css)
        $facture->update([
            'montant_ht' => round($montantHT, 2),
            'tva' => round($montantTVA, 2),
            'css' => round($montantCSS, 2),
            'montant_ttc' => round($montantTTC, 2),
        ]);
        
        Log::info('Totaux conventionnel facture calculés', [
            'facture_id' => $facture->id,
            'nb_lots' => $facture->lots->count(),
            'montant_ht' => $montantHT,
            'remise_montant' => $remiseMontant,
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Préparer les données pour la conversion vers facture
     */
    public function preparerPourConversion($document): array
    {
        $lots = [];
        
        foreach ($document->lots as $lot) {
            $lots[] = [
                'numero_lot' => $lot->numero_lot,
                'description' => $lot->description,
                'quantite' => $lot->quantite,
                'poids' => $lot->poids ?? null,
                'volume' => $lot->volume ?? null,
                'prix_unitaire' => $lot->prix_unitaire,
                'prix_total' => $lot->quantite * $lot->prix_unitaire,
            ];
        }
        
        return ['lots' => $lots];
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
        $data['prix_total'] = $data['quantite'] * $data['prix_unitaire'];
        
        return $data;
    }
}
