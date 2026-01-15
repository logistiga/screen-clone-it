<?php

namespace App\Services\OrdreTravail;

use App\Models\OrdreTravail;
use App\Services\OperationsIndependantes\OperationIndependanteFactory;
use App\Traits\CalculeTotauxTrait;

/**
 * Service spécialisé pour les ordres de travail de type Opérations Indépendantes.
 * Délègue aux services spécifiques par type (Location, Transport, Manutention, etc.)
 */
class OrdreIndependantService
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
        // Charger les lignes uniquement si non chargées
        if (!$ordre->relationLoaded('lignes')) {
            $ordre->load('lignes');
        }
        
        $montantHTBrut = $this->calculerTotalHT($ordre);
        $this->appliquerTotaux($ordre, $montantHTBrut, 'opérations indépendantes OT');
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
