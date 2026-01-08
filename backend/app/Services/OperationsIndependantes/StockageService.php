<?php

namespace App\Services\OperationsIndependantes;

use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les opérations de Stockage.
 * Calcul basé sur le nombre de jours entre date début et date fin.
 */
class StockageService
{
    public const TYPE = 'stockage';
    public const LABEL = 'Stockage';

    /**
     * Valider les données spécifiques au stockage
     */
    public function validerDonnees(array $ligne): array
    {
        $errors = [];
        
        if (empty($ligne['date_debut'])) {
            $errors[] = 'Date de début requise pour le stockage';
        }
        
        if (empty($ligne['date_fin'])) {
            $errors[] = 'Date de fin requise pour le stockage';
        }
        
        if (!empty($ligne['date_debut']) && !empty($ligne['date_fin'])) {
            if (strtotime($ligne['date_fin']) < strtotime($ligne['date_debut'])) {
                $errors[] = 'La date de fin doit être postérieure à la date de début';
            }
        }
        
        return $errors;
    }

    /**
     * Normaliser les données d'une ligne de stockage
     */
    public function normaliserLigne(array $data): array
    {
        $data['type_operation'] = self::TYPE;
        $data['quantite'] = $this->calculerNombreJours($data['date_debut'] ?? null, $data['date_fin'] ?? null);
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        
        return $data;
    }

    /**
     * Calculer le nombre de jours de stockage
     */
    public function calculerNombreJours(?string $dateDebut, ?string $dateFin): int
    {
        if (empty($dateDebut) || empty($dateFin)) {
            return 1;
        }
        
        $debut = new \DateTime($dateDebut);
        $fin = new \DateTime($dateFin);
        $diff = $fin->diff($debut);
        
        return max(1, $diff->days);
    }

    /**
     * Calculer le montant pour une ligne de stockage
     */
    public function calculerMontant(array $ligne): float
    {
        $quantite = $this->calculerNombreJours($ligne['date_debut'] ?? null, $ligne['date_fin'] ?? null);
        $prixUnitaire = $ligne['prix_unitaire'] ?? 0;
        
        return $quantite * $prixUnitaire;
    }

    /**
     * Obtenir les champs spécifiques pour ce type
     */
    public function getChampsSpecifiques(): array
    {
        return ['date_debut', 'date_fin'];
    }
}
