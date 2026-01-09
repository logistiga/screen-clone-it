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
                    $errors[] = "Conteneur #" . ($index + 1) . ": numéro requis";
                }
                if (empty($conteneur['taille'])) {
                    $errors[] = "Conteneur #" . ($index + 1) . ": taille requise";
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
            // Ajouter le prix de base du conteneur si défini
            $total += (float) ($conteneur->prix_unitaire ?? 0);
            
            // Ajouter les opérations
            foreach ($conteneur->operations as $operation) {
                $prixTotal = ($operation->quantite ?? 1) * ($operation->prix_unitaire ?? 0);
                $total += $prixTotal;
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
        $tvaActif = $taxesConfig->data['tva_actif'] ?? true;
        $cssActif = $taxesConfig->data['css_actif'] ?? true;
        
        // Calculer les taxes
        $montantTVA = $tvaActif ? $montantHT * ($tauxTVA / 100) : 0;
        $montantCSS = $cssActif ? $montantHT * ($tauxCSS / 100) : 0;
        $montantTTC = $montantHT + $montantTVA + $montantCSS;
        
        $facture->update([
            'montant_ht' => round($montantHT, 2),
            'tva' => round($montantTVA, 2),
            'css' => round($montantCSS, 2),
            'montant_ttc' => round($montantTTC, 2),
        ]);
        
        Log::info('Totaux conteneurs facture calculés', [
            'facture_id' => $facture->id,
            'montant_ht' => $montantHT,
            'tva' => $montantTVA,
            'css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Préparer les données pour la conversion vers facture
     */
    public function preparerPourConversion($document): array
    {
        $conteneurs = [];
        
        foreach ($document->conteneurs as $conteneur) {
            $conteneurData = [
                'numero' => $conteneur->numero,
                'taille' => $conteneur->taille,
                'description' => $conteneur->description,
                'prix_unitaire' => $conteneur->prix_unitaire,
                'operations' => [],
            ];
            
            foreach ($conteneur->operations as $op) {
                $conteneurData['operations'][] = [
                    'type' => $op->type,
                    'description' => $op->description,
                    'quantite' => $op->quantite,
                    'prix_unitaire' => $op->prix_unitaire,
                    'prix_total' => $op->quantite * $op->prix_unitaire,
                ];
            }
            
            $conteneurs[] = $conteneurData;
        }
        
        return ['conteneurs' => $conteneurs];
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
        
        // Prix unitaire par défaut
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        
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
        $data['prix_total'] = $data['quantite'] * $data['prix_unitaire'];
        
        return $data;
    }
}
