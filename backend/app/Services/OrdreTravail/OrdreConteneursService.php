<?php

namespace App\Services\OrdreTravail;

use App\Models\OrdreTravail;
use App\Models\Configuration;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les ordres de travail de type Conteneurs.
 * Gère la création, modification et calcul des totaux pour les conteneurs et leurs opérations.
 */
class OrdreConteneursService
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
     * Créer les conteneurs d'un ordre avec leurs opérations
     */
    public function creerConteneurs(OrdreTravail $ordre, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneurData) {
            $operations = $conteneurData['operations'] ?? [];
            unset($conteneurData['operations']);

            // Normalisation des données
            $conteneurData = $this->normaliserConteneur($conteneurData);

            $conteneur = $ordre->conteneurs()->create($conteneurData);

            foreach ($operations as $operation) {
                $operation = $this->normaliserOperation($operation);
                $conteneur->operations()->create($operation);
            }
        }
    }

    /**
     * Calculer le total HT des conteneurs
     */
    public function calculerTotalHT(OrdreTravail $ordre): float
    {
        $total = 0;
        
        foreach ($ordre->conteneurs as $conteneur) {
            foreach ($conteneur->operations as $operation) {
                $total += ($operation->quantite ?? 1) * ($operation->prix_unitaire ?? 0);
            }
        }
        
        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour l'ordre
     */
    public function calculerTotaux(OrdreTravail $ordre): void
    {
        // Recharger les conteneurs et opérations
        $ordre->load('conteneurs.operations');
        
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
        
        Log::info('Totaux conteneurs OT calculés', [
            'ordre_id' => $ordre->id,
            'montant_ht' => $montantHT,
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Préparer les données pour conversion en facture
     */
    public function preparerPourConversion(OrdreTravail $ordre): array
    {
        return [
            'conteneurs' => $ordre->conteneurs->map(function ($conteneur) {
                return [
                    'numero' => $conteneur->numero,
                    'type' => $conteneur->type,
                    'taille' => $conteneur->taille,
                    'armateur_id' => $conteneur->armateur_id,
                    'operations' => $conteneur->operations->map(function ($op) {
                        return [
                            'type_operation' => $op->type_operation ?? $op->type,
                            'description' => $op->description,
                            'lieu_depart' => $op->lieu_depart,
                            'lieu_arrivee' => $op->lieu_arrivee,
                            'date_debut' => $op->date_debut,
                            'date_fin' => $op->date_fin,
                            'quantite' => $op->quantite,
                            'prix_unitaire' => $op->prix_unitaire,
                        ];
                    })->toArray(),
                ];
            })->toArray(),
        ];
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
