<?php

namespace App\Services\Facture;

use App\Models\Facture;
use App\Services\OperationsIndependantes\OperationIndependanteFactory;
use App\Traits\CalculeTotauxTrait;

/**
 * Service spécialisé pour les factures de type Opérations Indépendantes.
 * Délègue aux services spécifiques par type (Location, Transport, Manutention, etc.)
 */
class FactureIndependantService
{
    use CalculeTotauxTrait;

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
        // Charger les lignes seulement si pas déjà chargées
        if (!$facture->relationLoaded('lignes')) {
            $facture->load('lignes');
        }
        
        $montantHTBrut = $this->calculerTotalHT($facture);
        
        // Utiliser le trait pour appliquer les totaux avec remise et taxes
        $this->appliquerTotaux($facture, $montantHTBrut, 'opérations indépendantes facture');
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
