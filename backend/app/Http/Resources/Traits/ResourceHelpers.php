<?php

namespace App\Http\Resources\Traits;

use Carbon\Carbon;

trait ResourceHelpers
{
    /**
     * Parser une date de façon sécurisée
     */
    protected function parseDate($value): ?Carbon
    {
        if (!$value) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Formater un montant avec 2 décimales
     */
    protected function formatMontant($value): float
    {
        return round((float) ($value ?? 0), 2);
    }

    /**
     * Formater une date en string ISO
     */
    protected function formatDate($value): ?string
    {
        $date = $this->parseDate($value);
        return $date?->toDateString();
    }

    /**
     * Formater une date-heure en string ISO
     */
    protected function formatDateTime($value): ?string
    {
        $date = $this->parseDate($value);
        return $date?->toISOString();
    }

    /**
     * Convertir un statut en format lisible
     */
    protected function formatStatut(string $statut): array
    {
        $config = [
            'brouillon' => ['label' => 'Brouillon', 'color' => 'gray'],
            'envoye' => ['label' => 'Envoyé', 'color' => 'blue'],
            'accepte' => ['label' => 'Accepté', 'color' => 'green'],
            'refuse' => ['label' => 'Refusé', 'color' => 'red'],
            'expire' => ['label' => 'Expiré', 'color' => 'orange'],
            'converti' => ['label' => 'Converti', 'color' => 'purple'],
            'en_cours' => ['label' => 'En cours', 'color' => 'blue'],
            'termine' => ['label' => 'Terminé', 'color' => 'green'],
            'annule' => ['label' => 'Annulé', 'color' => 'red'],
            'payee' => ['label' => 'Payée', 'color' => 'green'],
            'Payée' => ['label' => 'Payée', 'color' => 'green'],
            'Envoyée' => ['label' => 'Envoyée', 'color' => 'blue'],
            'Annulée' => ['label' => 'Annulée', 'color' => 'red'],
        ];

        return $config[$statut] ?? ['label' => ucfirst($statut), 'color' => 'gray'];
    }

    /**
     * Mapper la catégorie vers le type de document frontend
     */
    protected function mapCategorie(?string $categorie): string
    {
        return match ($categorie) {
            'conteneurs' => 'Conteneur',
            'conventionnel' => 'Lot',
            'operations_independantes' => 'Independant',
            default => $categorie ?? 'Inconnu',
        };
    }
}
