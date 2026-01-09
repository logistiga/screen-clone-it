<?php

namespace App\Services\Facture;

use App\Models\Facture;
use App\Models\Configuration;
use App\Services\OperationsIndependantes\OperationIndependanteFactory;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les factures de type Opérations Indépendantes.
 * Délègue aux services spécifiques par type (Location, Transport, Manutention, etc.)
 */
class FactureIndependantService
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
     * Créer les lignes de prestations d'une facture
     */
    public function creerLignes(Facture $facture, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $ligne = $this->operationFactory->normaliserLigne($ligne);
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
}
