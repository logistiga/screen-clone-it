<?php

namespace App\Services\Facture;

use App\Models\Facture;
use App\Models\Configuration;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les factures de type Opérations Indépendantes.
 * Gère la création, modification et calcul des totaux pour transport, location, manutention, stockage.
 */
class FactureIndependantService
{
    /**
     * Types d'opérations indépendantes supportées
     */
    public const TYPES_OPERATION = [
        'location' => 'Location véhicule/équipement',
        'transport' => 'Transport hors Libreville',
        'manutention' => 'Manutention',
        'double_relevage' => 'Double relevage',
        'stockage' => 'Stockage',
    ];

    /**
     * Valider les données spécifiques aux opérations indépendantes
     */
    public function validerDonnees(array $data): array
    {
        $errors = [];
        
        if (empty($data['lignes']) || !is_array($data['lignes'])) {
            $errors[] = 'Au moins une ligne de prestation est requise';
        } else {
            foreach ($data['lignes'] as $index => $ligne) {
                if (empty($ligne['type_operation'])) {
                    $errors[] = "Ligne #{$index}: type d'opération requis";
                }
            }
        }
        
        return $errors;
    }

    /**
     * Créer les lignes de prestations d'une facture
     */
    public function creerLignes(Facture $facture, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $ligne = $this->normaliserLigne($ligne);
            $facture->lignes()->create($ligne);
        }
    }

    /**
     * Calculer le total HT des lignes de prestations
     */
    public function calculerTotalHT(Facture $facture): float
    {
        $total = 0;
        
        foreach ($facture->lignes as $ligne) {
            $total += ($ligne->quantite ?? 1) * ($ligne->prix_unitaire ?? 0);
        }
        
        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour la facture
     */
    public function calculerTotaux(Facture $facture): void
    {
        // Recharger les lignes
        $facture->load('lignes');
        
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
        
        Log::info('Totaux opérations indépendantes facture calculés', [
            'facture_id' => $facture->id,
            'nb_lignes' => $facture->lignes->count(),
            'montant_ht' => $montantHT,
        ]);
    }

    /**
     * Calculer le nombre de jours entre deux dates
     */
    public function calculerNombreJours(?string $dateDebut, ?string $dateFin): int
    {
        if (empty($dateDebut) || empty($dateFin)) {
            return 1;
        }
        
        $debut = new \DateTime($dateDebut);
        $fin = new \DateTime($dateFin);
        $diff = $fin->diff($debut);
        
        return max(1, $diff->days);
    }

    /**
     * Normaliser les données d'une ligne depuis l'API
     */
    protected function normaliserLigne(array $data): array
    {
        // Valeurs par défaut
        $data['quantite'] = $data['quantite'] ?? 1;
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        
        // Calcul automatique de la quantité pour location/stockage
        if (in_array($data['type_operation'] ?? '', ['location', 'stockage'])) {
            if (!empty($data['date_debut']) && !empty($data['date_fin'])) {
                $data['quantite'] = $this->calculerNombreJours($data['date_debut'], $data['date_fin']);
            }
        }
        
        return $data;
    }
}
