<?php

namespace App\Services\OperationsIndependantes;

use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les opérations de Manutention.
 * Calcul basé sur la quantité et prix unitaire.
 */
class ManutentionService
{
    public const TYPE = 'manutention';
    public const LABEL = 'Manutention';

    /**
     * Valider les données spécifiques à la manutention
     */
    public function validerDonnees(array $ligne): array
    {
        $errors = [];
        
        if (empty($ligne['description'])) {
            $errors[] = 'Description requise pour la manutention';
        }
        
        return $errors;
    }

    /**
     * Normaliser les données d'une ligne de manutention
     */
    public function normaliserLigne(array $data): array
    {
        $data['type_operation'] = self::TYPE;
        $data['quantite'] = $data['quantite'] ?? 1;
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        
        return $data;
    }

    /**
     * Calculer le montant pour une ligne de manutention
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
