<?php

namespace App\Services\OrdreTravail;

use App\Models\OrdreTravail;
use App\Models\Configuration;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les ordres de travail de type Opérations Indépendantes.
 * Gère la création, modification et calcul des totaux pour transport, location, manutention, stockage.
 */
class OrdreIndependantService
{
    /**
     * Types d'opérations indépendantes supportées
     */
    public const TYPES_OPERATION = [
        'location' => 'Location véhicule/équipement',
        'transport' => 'Transport hors Libreville',
        'manutention' => 'Manutention',
        'double_relevage' => 'Double relevage',
        'stockage' => 'Stockage',
    ];

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
                if (empty($ligne['type_operation'])) {
                    $errors[] = "Ligne #{$index}: type d'opération requis";
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
            $ligne = $this->normaliserLigne($ligne);
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
        // Recharger les lignes
        $ordre->load('lignes');
        
        $montantHT = $this->calculerTotalHT($ordre);
        
        // Récupérer les taux depuis la configuration taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;
        
        // Appliquer taxes selon catégorie
        if ($ordre->categorie === 'non_assujetti') {
            $montantTVA = 0;
            $montantCSS = 0;
        } else {
            $montantTVA = $montantHT * ($tauxTVA / 100);
            $montantCSS = $montantHT * ($tauxCSS / 100);
        }
        
        $montantTTC = $montantHT + $montantTVA + $montantCSS;
        
        $ordre->update([
            'montant_ht' => $montantHT,
            'montant_tva' => $montantTVA,
            'montant_css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
        
        Log::info('Totaux opérations indépendantes OT calculés', [
            'ordre_id' => $ordre->id,
            'nb_lignes' => $ordre->lignes->count(),
            'montant_ht' => $montantHT,
        ]);
    }

    /**
     * Calculer le nombre de jours entre deux dates
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

    /**
     * Normaliser les données d'une ligne depuis l'API
     */
    protected function normaliserLigne(array $data): array
    {
        // Valeurs par défaut
        $data['quantite'] = $data['quantite'] ?? 1;
        $data['prix_unitaire'] = $data['prix_unitaire'] ?? 0;
        
        // Calcul automatique de la quantité pour location/stockage
        if (in_array($data['type_operation'] ?? '', ['location', 'stockage'])) {
            if (!empty($data['date_debut']) && !empty($data['date_fin'])) {
                $data['quantite'] = $this->calculerNombreJours($data['date_debut'], $data['date_fin']);
            }
        }
        
        return $data;
    }
}
