<?php

namespace App\Services\Devis;

use App\Models\Devis;
use App\Models\Configuration;
use App\Services\OperationsIndependantes\OperationIndependanteFactory;
use Illuminate\Support\Facades\Log;

/**
 * Service spécialisé pour les devis de type Opérations Indépendantes.
 * Délègue aux services spécifiques par type (Location, Transport, Manutention, etc.)
 */
class DevisIndependantService
{
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
     * Créer les lignes de prestations d'un devis
     */
    public function creerLignes(Devis $devis, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $ligne = $this->operationFactory->normaliserLigne($ligne);
            $devis->lignes()->create($ligne);
        }
    }

    /**
     * Calculer le total HT des lignes de prestations
     */
    public function calculerTotalHT(Devis $devis): float
    {
        $total = 0;
        
        foreach ($devis->lignes as $ligne) {
            $total += $ligne->quantite * $ligne->prix_unitaire;
        }
        
        return $total;
    }

    /**
     * Calculer tous les totaux (HT, TVA, CSS, TTC) et mettre à jour le devis
     */
    public function calculerTotaux(Devis $devis): void
    {
        // Recharger les lignes
        $devis->load('lignes');
        
        $montantHT = $this->calculerTotalHT($devis);
        
        // Récupérer les taux depuis la configuration taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;
        
        $montantTVA = $montantHT * ($tauxTVA / 100);
        $montantCSS = $montantHT * ($tauxCSS / 100);
        $montantTTC = $montantHT + $montantTVA + $montantCSS;
        
        $devis->update([
            'montant_ht' => $montantHT,
            'tva' => $montantTVA,
            'css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
        
        Log::info('Totaux opérations indépendantes calculés', [
            'devis_id' => $devis->id,
            'nb_lignes' => $devis->lignes->count(),
            'montant_ht' => $montantHT,
        ]);
    }

    /**
     * Préparer les données pour conversion en ordre de travail
     */
    public function preparerPourConversion(Devis $devis): array
    {
        return [
            'lignes' => $devis->lignes->map(function ($ligne) {
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
