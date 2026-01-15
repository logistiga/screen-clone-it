<?php

namespace App\Services\Devis;

use App\Models\Devis;
use App\Services\OperationsIndependantes\OperationIndependanteFactory;
use App\Traits\CalculeTotauxTrait;

/**
 * Service spécialisé pour les devis de type Opérations Indépendantes.
 * Délègue aux services spécifiques par type (Location, Transport, Manutention, etc.)
 */
class DevisIndependantService
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
                    $errors[] = "Ligne #{$index}: {$error}";
                }
            }
        }
        
        return $errors;
    }

    /**
     * Créer les lignes de prestations d'un devis
     */
    public function creerLignes(Devis $devis, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $ligne = $this->operationFactory->normaliserLigne($ligne);
            $devis->lignes()->create($ligne);
        }
    }

    /**
     * Calculer le total HT des lignes de prestations
     */
    public function calculerTotalHT(Devis $devis): float
    {
        $total = 0;
        
        foreach ($devis->lignes as $ligne) {
            $total += $ligne->quantite * $ligne->prix_unitaire;
        }
        
        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour le devis
     */
    public function calculerTotaux(Devis $devis): void
    {
        // Charger les lignes seulement si pas déjà chargées
        if (!$devis->relationLoaded('lignes')) {
            $devis->load('lignes');
        }
        
        $montantHTBrut = $this->calculerTotalHT($devis);
        
        // Utiliser le trait pour appliquer les totaux avec remise et taxes
        $this->appliquerTotaux($devis, $montantHTBrut, 'opérations indépendantes devis');
    }

    /**
     * Préparer les données pour conversion en ordre de travail
     */
    public function preparerPourConversion(Devis $devis): array
    {
        return [
            'lignes' => $devis->lignes->map(function ($ligne) {
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
