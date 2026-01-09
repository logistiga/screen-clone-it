<?php

namespace App\Console\Commands;

use App\Models\Facture;
use App\Models\Configuration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecalculerTotauxFactures extends Command
{
    protected $signature = 'factures:recalculer-totaux {--all : Recalculer toutes les factures, pas seulement celles à zéro}';
    protected $description = 'Recalcule les totaux (HT, TVA, CSS, TTC) pour les factures dont les montants sont à zéro';

    public function handle(): int
    {
        $this->info('=== Recalcul des totaux des factures ===');

        // Récupérer les taux de taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;

        $this->info("Taux TVA: {$tauxTVA}% | Taux CSS: {$tauxCSS}%");

        // Sélectionner les factures à recalculer
        $query = Facture::with(['conteneurs.operations', 'lots', 'lignes']);
        
        if (!$this->option('all')) {
            $query->where(function ($q) {
                $q->whereNull('montant_ttc')
                  ->orWhere('montant_ttc', 0)
                  ->orWhere('montant_ttc', '<=', 0);
            });
        }

        $factures = $query->get();
        $total = $factures->count();

        if ($total === 0) {
            $this->info('Aucune facture à recalculer.');
            return Command::SUCCESS;
        }

        $this->info("Factures à traiter: {$total}");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $updated = 0;
        $errors = 0;

        foreach ($factures as $facture) {
            try {
                DB::transaction(function () use ($facture, $tauxTVA, $tauxCSS, &$updated) {
                    $montantHT = $this->calculerMontantHT($facture);

                    // Calculer selon la catégorie
                    if ($facture->categorie === 'non_assujetti') {
                        $montantTVA = 0;
                        $montantCSS = 0;
                    } else {
                        $montantTVA = $montantHT * ($tauxTVA / 100);
                        $montantCSS = $montantHT * ($tauxCSS / 100);
                    }

                    $montantTTC = $montantHT + $montantTVA + $montantCSS;

                    $facture->update([
                        'montant_ht' => $montantHT,
                        'montant_tva' => $montantTVA,
                        'montant_css' => $montantCSS,
                        'montant_ttc' => $montantTTC,
                    ]);

                    $updated++;

                    Log::info('Facture recalculée', [
                        'facture_id' => $facture->id,
                        'numero' => $facture->numero,
                        'montant_ht' => $montantHT,
                        'montant_ttc' => $montantTTC,
                    ]);
                });
            } catch (\Throwable $e) {
                $errors++;
                Log::error('Erreur recalcul facture', [
                    'facture_id' => $facture->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("Résultat: {$updated} factures mises à jour, {$errors} erreurs");

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Calculer le montant HT
     */
    protected function calculerMontantHT(Facture $facture): float
    {
        $montant = 0;

        // Lignes directes
        foreach ($facture->lignes as $ligne) {
            $montant += ($ligne->quantite ?? 1) * ($ligne->prix_unitaire ?? 0);
        }

        // Opérations des conteneurs
        foreach ($facture->conteneurs as $conteneur) {
            foreach ($conteneur->operations as $op) {
                $montant += ($op->quantite ?? 1) * ($op->prix_unitaire ?? 0);
            }
        }

        // Lots
        foreach ($facture->lots as $lot) {
            $montant += ($lot->quantite ?? 1) * ($lot->prix_unitaire ?? 0);
        }

        return $montant;
    }
}
