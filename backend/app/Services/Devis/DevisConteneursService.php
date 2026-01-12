<?php

namespace App\Services\Devis;

use App\Models\Devis;
use App\Models\Configuration;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les devis de type Conteneurs.
 * Gère la création, modification et calcul des totaux pour les conteneurs et leurs opérations.
 */
class DevisConteneursService
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
     * Créer les conteneurs d'un devis avec leurs opérations
     */
    public function creerConteneurs(Devis $devis, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneurData) {
            $operations = $conteneurData['operations'] ?? [];
            unset($conteneurData['operations']);

            // Normalisation des données
            $conteneurData = $this->normaliserConteneur($conteneurData);

            $conteneur = $devis->conteneurs()->create($conteneurData);

            foreach ($operations as $operation) {
                $operation = $this->normaliserOperation($operation);
                $conteneur->operations()->create($operation);
            }
        }
    }

    /**
     * Calculer le total HT des conteneurs
     */
    public function calculerTotalHT(Devis $devis): float
    {
        $total = 0;

        foreach ($devis->conteneurs as $conteneur) {
            // Prix du conteneur (saisi dans le formulaire)
            $total += (float) ($conteneur->prix_unitaire ?? 0);

            // + total des opérations
            foreach ($conteneur->operations as $operation) {
                $total += (float) $operation->quantite * (float) $operation->prix_unitaire;
            }
        }

        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour le devis
     */
    public function calculerTotaux(Devis $devis): void
    {
        // Recharger les conteneurs et opérations
        $devis->load('conteneurs.operations');
        
        $montantHT = $this->calculerTotalHT($devis);
        
        // Appliquer la remise si présente
        $remiseMontant = (float) ($devis->remise_montant ?? 0);
        $montantHTApresRemise = max(0, $montantHT - $remiseMontant);
        
        // Récupérer les taux depuis la configuration taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;
        
        // Calculer les taxes sur le montant après remise
        $montantTVA = $montantHTApresRemise * ($tauxTVA / 100);
        $montantCSS = $montantHTApresRemise * ($tauxCSS / 100);
        $montantTTC = $montantHTApresRemise + $montantTVA + $montantCSS;
        
        $devis->update([
            'montant_ht' => $montantHT,
            'tva' => $montantTVA,
            'css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
        
        Log::info('Totaux conteneurs calculés', [
            'devis_id' => $devis->id,
            'montant_ht' => $montantHT,
            'remise_montant' => $remiseMontant,
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Préparer les données pour conversion en ordre de travail
     */
    public function preparerPourConversion(Devis $devis): array
    {
        return [
            'conteneurs' => $devis->conteneurs->map(function ($conteneur) {
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
        
        return $data;
    }
}
