<?php

namespace App\Http\Controllers\Api;

trait NoteDebutTypeConfig
{
    /**
     * Configuration par type de note
     */
    protected function getTypeConfig(string $type): array
    {
        $configs = [
            'detention' => [
                'titre' => 'Note de Détention',
                'label' => 'Détention',
                'couleur' => '#dc2626',
                'badge_bg' => '#fee2e2',
            ],
            'Detention' => [
                'titre' => 'Note de Détention',
                'label' => 'Détention',
                'couleur' => '#dc2626',
                'badge_bg' => '#fee2e2',
            ],
            'ouverture_port' => [
                'titre' => 'Note d\'Ouverture de Port',
                'label' => 'Ouverture de Port',
                'couleur' => '#2563eb',
                'badge_bg' => '#dbeafe',
            ],
            'Ouverture Port' => [
                'titre' => 'Note d\'Ouverture de Port',
                'label' => 'Ouverture de Port',
                'couleur' => '#2563eb',
                'badge_bg' => '#dbeafe',
            ],
            'reparation' => [
                'titre' => 'Note de Réparation',
                'label' => 'Réparation',
                'couleur' => '#d97706',
                'badge_bg' => '#fef3c7',
            ],
            'Reparation' => [
                'titre' => 'Note de Réparation',
                'label' => 'Réparation',
                'couleur' => '#d97706',
                'badge_bg' => '#fef3c7',
            ],
            'relache' => [
                'titre' => 'Note de Relâche',
                'label' => 'Relâche',
                'couleur' => '#059669',
                'badge_bg' => '#d1fae5',
            ],
            'Relache' => [
                'titre' => 'Note de Relâche',
                'label' => 'Relâche',
                'couleur' => '#059669',
                'badge_bg' => '#d1fae5',
            ],
            'divers' => [
                'titre' => 'Note de Débit Divers',
                'label' => 'Divers',
                'couleur' => '#475569',
                'badge_bg' => '#e2e8f0',
            ],
            'Divers' => [
                'titre' => 'Note de Débit Divers',
                'label' => 'Divers',
                'couleur' => '#475569',
                'badge_bg' => '#e2e8f0',
            ],
        ];

        return $configs[$type] ?? [
            'titre' => 'Note de Début',
            'label' => ucfirst($type),
            'couleur' => '#dc2626',
            'badge_bg' => '#fee2e2',
        ];
    }
}
