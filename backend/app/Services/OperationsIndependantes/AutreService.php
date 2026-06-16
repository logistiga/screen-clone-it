<?php

namespace App\Services\OperationsIndependantes;

class AutreService
{
    public const TYPE = 'autre';
    public const LABEL = 'Autre';

    public function validerDonnees(array $ligne): array
    {
        $errors = [];
        if (empty($ligne['description'])) {
            $errors[] = 'Description requise pour le type Autre';
        }
        return $errors;
    }

    public function normaliserLigne(array $data): array
    {
        $data['type_operation'] = self::TYPE;
        $data['quantite'] = $data['quantite'] ?? 1;
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        return $data;
    }

    public function calculerMontant(array $ligne): float
    {
        return ($ligne['quantite'] ?? 1) * ($ligne['prix_unitaire'] ?? 0);
    }

    public function getChampsSpecifiques(): array
    {
        return [];
    }
}
