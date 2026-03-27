<?php

namespace App\Services\Export;

use Illuminate\Support\Collection;

/**
 * Helpers partagés par les sous-services d'export (CSV generation, formatage)
 */
trait ExportHelpersTrait
{
    protected function generateCSV(array $headers, Collection|array $rows): string
    {
        $output = implode(';', $headers) . "\n";

        foreach ($rows as $row) {
            $output .= implode(';', array_map(function ($cell) {
                $cell = str_replace('"', '""', (string) $cell);
                if (str_contains($cell, ';') || str_contains($cell, '"') || str_contains($cell, "\n")) {
                    return '"' . $cell . '"';
                }
                return $cell;
            }, $row)) . "\n";
        }

        return $output;
    }

    protected function formatStatut(string $statut): string
    {
        return match ($statut) {
            'brouillon' => 'Brouillon',
            'en_attente' => 'En attente',
            'valide' => 'Validé',
            'envoye' => 'Envoyé',
            'accepte' => 'Accepté',
            'refuse' => 'Refusé',
            'expire' => 'Expiré',
            'partiel' => 'Partiellement payé',
            'paye' => 'Payé',
            'annule' => 'Annulé',
            'en_cours' => 'En cours',
            'termine' => 'Terminé',
            'actif' => 'Actif',
            'rembourse' => 'Remboursé',
            default => ucfirst($statut),
        };
    }

    protected function formatModePaiement(string $mode): string
    {
        return match ($mode) {
            'especes' => 'Espèces',
            'cheque' => 'Chèque',
            'virement' => 'Virement',
            'carte' => 'Carte bancaire',
            'mobile' => 'Mobile Money',
            default => ucfirst($mode),
        };
    }

    protected function formatTypeDocument(string $type): string
    {
        return match ($type) {
            'facture' => 'Facture',
            'devis' => 'Devis',
            'ordre' => 'Ordre de travail',
            default => ucfirst($type),
        };
    }

    protected function formatCategorie(string $categorie): string
    {
        return match ($categorie) {
            'conteneurs' => 'Conteneurs',
            'conventionnel' => 'Conventionnel',
            'independant' => 'Indépendant',
            default => ucfirst($categorie),
        };
    }
}
