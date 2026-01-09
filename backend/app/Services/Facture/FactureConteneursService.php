<?php

namespace App\Services\Facture;

use App\Models\Facture;
use App\Models\Configuration;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les factures de type Conteneurs.
 * Gère la création, modification et calcul des totaux pour les conteneurs et leurs opérations.
 */
class FactureConteneursService
{
    /**
     * Valider les données spécifiques aux conteneurs
     */
    public function validerDonnees(array $data): array
    {
        $errors = [];
        
        if (empty($data['conteneurs']) || !is_array($data['conteneurs'])) {
            $errors[] = 'Au moins un conteneur est requis';
        } else {
            foreach ($data['conteneurs'] as $index => $conteneur) {
                if (empty($conteneur['numero'])) {
                    $errors[] = "Conteneur #{$index}: numéro requis";
                }
                if (empty($conteneur['taille'])) {
                    $errors[] = "Conteneur #{$index}: taille requise";
                }
            }
        }
        
        return $errors;
    }

    /**
     * Créer les conteneurs d'une facture avec leurs opérations
     */
    public function creerConteneurs(Facture $facture, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneurData) {
            $operations = $conteneurData['operations'] ?? [];
            unset($conteneurData['operations']);

            // Normalisation des données
            $conteneurData = $this->normaliserConteneur($conteneurData);

            $conteneur = $facture->conteneurs()->create($conteneurData);

            foreach ($operations as $operation) {
                $operation = $this->normaliserOperation($operation);
                $conteneur->operations()->create($operation);
            }
        }
    }

    /**
     * Calculer le total HT des conteneurs
     */
    public function calculerTotalHT(Facture $facture): float
    {
        $total = 0;
        
        foreach ($facture->conteneurs as $conteneur) {
            foreach ($conteneur->operations as $operation) {
                $total += ($operation->quantite ?? 1) * ($operation->prix_unitaire ?? 0);
            }
        }
        
        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour la facture
     */
    public function calculerTotaux(Facture $facture): void
    {
        // Recharger les conteneurs et opérations
        $facture->load('conteneurs.operations');
        
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
        
        Log::info('Totaux conteneurs facture calculés', [
            'facture_id' => $facture->id,
            'montant_ht' => $montantHT,
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Normaliser les données d'un conteneur depuis l'API
     */
    protected function normaliserConteneur(array $data): array
    {
        // Normaliser la taille (20 -> 20, 20' -> 20)
        if (isset($data['taille'])) {
            $data['taille'] = str_replace("'", "", $data['taille']);
        }
        
        // Type par défaut
        if (empty($data['type'])) {
            $data['type'] = 'DRY';
        }
        
        return $data;
    }

    /**
     * Normaliser une opération depuis l'API
     */
    protected function normaliserOperation(array $data): array
    {
        // API envoie type_operation, DB attend type
        if (isset($data['type_operation']) && !isset($data['type'])) {
            $data['type'] = $data['type_operation'];
            unset($data['type_operation']);
        }
        
        // Valeurs par défaut
        $data['quantite'] = $data['quantite'] ?? 1;
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        
        return $data;
    }
}
