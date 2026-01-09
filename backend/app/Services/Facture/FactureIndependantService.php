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
                    $errors[] = "Ligne #" . ($index + 1) . ": {$error}";
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
        $tvaActif = $taxesConfig->data['tva_actif'] ?? true;
        $cssActif = $taxesConfig->data['css_actif'] ?? true;
        
        // Calculer les taxes
        $montantTVA = $tvaActif ? $montantHT * ($tauxTVA / 100) : 0;
        $montantCSS = $cssActif ? $montantHT * ($tauxCSS / 100) : 0;
        $montantTTC = $montantHT + $montantTVA + $montantCSS;
        
        // Utiliser les bons noms de colonnes (tva, css)
        $facture->update([
            'montant_ht' => round($montantHT, 2),
            'tva' => round($montantTVA, 2),
            'css' => round($montantCSS, 2),
            'montant_ttc' => round($montantTTC, 2),
        ]);
        
        Log::info('Totaux opérations indépendantes facture calculés', [
            'facture_id' => $facture->id,
            'nb_lignes' => $facture->lignes->count(),
            'montant_ht' => $montantHT,
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Préparer les données pour la conversion vers facture
     */
    public function preparerPourConversion($document): array
    {
        $lignes = [];
        
        foreach ($document->lignes as $ligne) {
            $lignes[] = [
                'description' => $ligne->description,
                'quantite' => $ligne->quantite,
                'prix_unitaire' => $ligne->prix_unitaire,
                'montant_ht' => $ligne->quantite * $ligne->prix_unitaire,
                'lieu_depart' => $ligne->lieu_depart ?? null,
                'lieu_arrivee' => $ligne->lieu_arrivee ?? null,
                'date_debut' => $ligne->date_debut ?? null,
                'date_fin' => $ligne->date_fin ?? null,
            ];
        }
        
        return ['lignes' => $lignes];
    }
}
