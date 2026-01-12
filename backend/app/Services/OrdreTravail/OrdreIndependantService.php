<?php

namespace App\Services\OrdreTravail;

use App\Models\OrdreTravail;
use App\Models\Configuration;
use App\Services\OperationsIndependantes\OperationIndependanteFactory;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les ordres de travail de type Opérations Indépendantes.
 * Délègue aux services spécifiques par type (Location, Transport, Manutention, etc.)
 */
class OrdreIndependantService
{
    protected OperationIndependanteFactory $operationFactory;

    public function __construct(OperationIndependanteFactory $operationFactory)
    {
        $this->operationFactory = $operationFactory;
    }

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
                $ligneErrors = $this->operationFactory->validerLigne($ligne);
                foreach ($ligneErrors as $error) {
                    $errors[] = "Ligne #{$index}: {$error}";
                }
            }
        }
        
        return $errors;
    }

    /**
     * Créer les lignes de prestations d'un ordre
     */
    public function creerLignes(OrdreTravail $ordre, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $ligne = $this->operationFactory->normaliserLigne($ligne);
            $ordre->lignes()->create($ligne);
        }
    }

    /**
     * Calculer le total HT des lignes de prestations
     */
    public function calculerTotalHT(OrdreTravail $ordre): float
    {
        $total = 0;
        
        foreach ($ordre->lignes as $ligne) {
            $total += ($ligne->quantite ?? 1) * ($ligne->prix_unitaire ?? 0);
        }
        
        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour l'ordre
     */
    public function calculerTotaux(OrdreTravail $ordre): void
    {
        // Recharger les lignes
        $ordre->load('lignes');
        
        $montantHT = $this->calculerTotalHT($ordre);
        
        // Appliquer la remise si présente
        $remiseMontant = (float) ($ordre->remise_montant ?? 0);
        $montantHTApresRemise = max(0, $montantHT - $remiseMontant);
        
        // Récupérer les taux depuis la configuration taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;
        
        // Appliquer taxes selon catégorie
        if ($ordre->categorie === 'non_assujetti') {
            $montantTVA = 0;
            $montantCSS = 0;
        } else {
            // Calculer les taxes sur le montant après remise
            $montantTVA = $montantHTApresRemise * ($tauxTVA / 100);
            $montantCSS = $montantHTApresRemise * ($tauxCSS / 100);
        }
        
        $montantTTC = $montantHTApresRemise + $montantTVA + $montantCSS;
        
        $ordre->update([
            'montant_ht' => round($montantHT, 2),
            'tva' => round($montantTVA, 2),
            'css' => round($montantCSS, 2),
            'montant_ttc' => round($montantTTC, 2),
        ]);
        
        Log::info('Totaux opérations indépendantes OT calculés', [
            'ordre_id' => $ordre->id,
            'nb_lignes' => $ordre->lignes->count(),
            'montant_ht' => $montantHT,
            'remise_montant' => $remiseMontant,
        ]);
    }

    /**
     * Préparer les données pour conversion en facture
     */
    public function preparerPourConversion(OrdreTravail $ordre): array
    {
        return [
            'lignes' => $ordre->lignes->map(function ($ligne) {
                return [
                    'type_operation' => $ligne->type_operation,
                    'description' => $ligne->description,
                    'lieu_depart' => $ligne->lieu_depart,
                    'lieu_arrivee' => $ligne->lieu_arrivee,
                    'date_debut' => $ligne->date_debut,
                    'date_fin' => $ligne->date_fin,
                    'quantite' => $ligne->quantite,
                    'prix_unitaire' => $ligne->prix_unitaire,
                ];
            })->toArray(),
        ];
    }
}
