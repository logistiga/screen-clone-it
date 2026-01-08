<?php

namespace App\Services\OperationsIndependantes;

use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les opérations de Transport hors Libreville.
 * Calcul basé sur la quantité (nombre de trajets) et prix par trajet.
 */
class TransportService
{
    public const TYPE = 'transport';
    public const LABEL = 'Transport hors Libreville';

    /**
     * Valider les données spécifiques au transport
     */
    public function validerDonnees(array $ligne): array
    {
        $errors = [];
        
        if (empty($ligne['lieu_depart'])) {
            $errors[] = 'Lieu de départ requis pour le transport';
        }
        
        if (empty($ligne['lieu_arrivee'])) {
            $errors[] = 'Lieu d\'arrivée requis pour le transport';
        }
        
        return $errors;
    }

    /**
     * Normaliser les données d'une ligne de transport
     */
    public function normaliserLigne(array $data): array
    {
        $data['type_operation'] = self::TYPE;
        $data['quantite'] = $data['quantite'] ?? 1;
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        
        return $data;
    }

    /**
     * Calculer le montant pour une ligne de transport
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
        return ['lieu_depart', 'lieu_arrivee'];
    }
}
