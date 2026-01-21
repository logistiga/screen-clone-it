<?php

namespace App\Traits;

use App\Models\TaxeMensuelle;
use App\Models\Taxe;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Trait pour agréger automatiquement les taxes lors de la création/modification de documents.
 * À utiliser dans les services Facture et OrdreTravail.
 */
trait CalculeTaxesTrait
{
    /**
     * Agréger les taxes d'un document nouvellement créé/modifié
     * 
     * @param object $document Facture ou OrdreTravail
     * @param string $typeDocument 'facture' ou 'ordre'
     */
    protected function agregerTaxesDocument(object $document, string $typeDocument = 'facture'): void
    {
        try {
            // Récupérer la date du document
            $dateCreation = $document->date_creation ?? $document->created_at ?? now();
            if (is_string($dateCreation)) {
                $dateCreation = Carbon::parse($dateCreation);
            }
            
            $annee = (int) $dateCreation->format('Y');
            $mois = (int) $dateCreation->format('n');
            
            // Montant HT après remise
            $montantHT = (float) ($document->montant_ht ?? 0);
            $remise = (float) ($document->remise_montant ?? 0);
            $montantHTNet = $montantHT - $remise;
            
            // Récupérer les taxes actives depuis la table taxes
            $taxesActives = Taxe::active()->ordonne()->get();
            
            foreach ($taxesActives as $taxe) {
                $code = strtoupper($taxe->code);
                
                // Déterminer si cette taxe est exonérée sur ce document
                $champExonere = $this->getChampExoneration($code);
                $estExonere = $champExonere ? (bool) ($document->$champExonere ?? false) : false;
                
                // Calculer le montant de taxe
                $montantTaxe = 0;
                if (!$estExonere) {
                    // Essayer de récupérer depuis le document, sinon calculer
                    $champTaxe = $this->getChampMontantTaxe($code);
                    if ($champTaxe && isset($document->$champTaxe)) {
                        $montantTaxe = (float) $document->$champTaxe;
                    } else {
                        $montantTaxe = round($montantHTNet * ($taxe->taux / 100), 2);
                    }
                }
                
                // Ajouter à l'agrégation mensuelle
                TaxeMensuelle::ajouterDocument(
                    $annee,
                    $mois,
                    $code,
                    $montantHTNet,
                    $montantTaxe,
                    $estExonere
                );
            }
            
            Log::info("Taxes agrégées pour {$typeDocument}", [
                'document_id' => $document->id,
                'numero' => $document->numero ?? 'N/A',
                'annee' => $annee,
                'mois' => $mois,
                'montant_ht_net' => $montantHTNet,
            ]);
            
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'agrégation des taxes", [
                'document_id' => $document->id ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }
    
    /**
     * Retirer les taxes d'un document (annulation/suppression)
     * 
     * @param object $document Facture ou OrdreTravail
     * @param string $typeDocument 'facture' ou 'ordre'
     */
    protected function retirerTaxesDocument(object $document, string $typeDocument = 'facture'): void
    {
        try {
            $dateCreation = $document->date_creation ?? $document->created_at ?? now();
            if (is_string($dateCreation)) {
                $dateCreation = Carbon::parse($dateCreation);
            }
            
            $annee = (int) $dateCreation->format('Y');
            $mois = (int) $dateCreation->format('n');
            
            $montantHT = (float) ($document->montant_ht ?? 0);
            $remise = (float) ($document->remise_montant ?? 0);
            $montantHTNet = $montantHT - $remise;
            
            $taxesActives = Taxe::active()->ordonne()->get();
            
            foreach ($taxesActives as $taxe) {
                $code = strtoupper($taxe->code);
                
                $champExonere = $this->getChampExoneration($code);
                $estExonere = $champExonere ? (bool) ($document->$champExonere ?? false) : false;
                
                $montantTaxe = 0;
                if (!$estExonere) {
                    $champTaxe = $this->getChampMontantTaxe($code);
                    if ($champTaxe && isset($document->$champTaxe)) {
                        $montantTaxe = (float) $document->$champTaxe;
                    } else {
                        $montantTaxe = round($montantHTNet * ($taxe->taux / 100), 2);
                    }
                }
                
                TaxeMensuelle::retirerDocument(
                    $annee,
                    $mois,
                    $code,
                    $montantHTNet,
                    $montantTaxe,
                    $estExonere
                );
            }
            
            Log::info("Taxes retirées pour {$typeDocument}", [
                'document_id' => $document->id,
                'numero' => $document->numero ?? 'N/A',
            ]);
            
        } catch (\Exception $e) {
            Log::error("Erreur lors du retrait des taxes", [
                'document_id' => $document->id ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }
    
    /**
     * Recalculer l'agrégation pour un document modifié
     * (retire l'ancien et ajoute le nouveau)
     * 
     * @param object $ancienDocument État avant modification
     * @param object $nouveauDocument État après modification
     * @param string $typeDocument 'facture' ou 'ordre'
     */
    protected function recalculerTaxesDocument(object $ancienDocument, object $nouveauDocument, string $typeDocument = 'facture'): void
    {
        $this->retirerTaxesDocument($ancienDocument, $typeDocument);
        $this->agregerTaxesDocument($nouveauDocument, $typeDocument);
    }
    
    /**
     * Obtenir le nom du champ d'exonération pour un type de taxe
     */
    private function getChampExoneration(string $codeTaxe): ?string
    {
        return match (strtoupper($codeTaxe)) {
            'TVA' => 'exonere_tva',
            'CSS' => 'exonere_css',
            default => 'exonere_' . strtolower($codeTaxe),
        };
    }
    
    /**
     * Obtenir le nom du champ de montant de taxe pour un type
     */
    private function getChampMontantTaxe(string $codeTaxe): ?string
    {
        return match (strtoupper($codeTaxe)) {
            'TVA' => 'tva',
            'CSS' => 'css',
            default => strtolower($codeTaxe),
        };
    }
}
