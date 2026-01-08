<?php

namespace App\Services\OperationsIndependantes;

use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les opérations de Double relevage.
 * Calcul basé sur la quantité et prix unitaire.
 */
class DoubleRelevageService
{
    public const TYPE = 'double_relevage';
    public const LABEL = 'Double relevage';

    /**
     * Valider les données spécifiques au double relevage
     */
    public function validerDonnees(array $ligne): array
    {
        $errors = [];
        
        if (empty($ligne['description'])) {
            $errors[] = 'Description requise pour le double relevage';
        }
        
        return $errors;
    }

    /**
     * Normaliser les données d'une ligne de double relevage
     */
    public function normaliserLigne(array $data): array
    {
        $data['type_operation'] = self::TYPE;
        $data['quantite'] = $data['quantite'] ?? 1;
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        
        return $data;
    }

    /**
     * Calculer le montant pour une ligne de double relevage
     */
    public function calculerMontant(array $ligne): float
    {
        $quantite = $ligne['quantite'] ?? 1;
        $prixUnitaire = $ligne['prix_unitaire'] ?? 0;
        
        return $quantite * $prixUnitaire;
    }

    /**
     * Obtenir les champs spécifiques pour ce type
     */
    public function getChampsSpecifiques(): array
    {
        return [];
    }
}
