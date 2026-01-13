<?php

namespace App\Console\Commands;

use App\Models\OrdreTravail;
use App\Models\Configuration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecalculerTotauxOrdres extends Command
{
    protected $signature = 'ordres:recalculer-totaux {--all : Recalculer tous les ordres, pas seulement ceux à zéro}';
    protected $description = 'Recalcule les totaux (HT, TVA, CSS, TTC) pour les ordres de travail dont les montants sont à zéro';

    public function handle(): int
    {
        $this->info('=== Recalcul des totaux des ordres de travail ===');

        // Récupérer les taux de taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;

        $this->info("Taux TVA: {$tauxTVA}% | Taux CSS: {$tauxCSS}%");

        // Sélectionner les ordres à recalculer
        $query = OrdreTravail::with(['conteneurs.operations', 'lots', 'lignes']);
        
        if (!$this->option('all')) {
            $query->where(function ($q) {
                $q->whereNull('montant_ttc')
                  ->orWhere('montant_ttc', 0)
                  ->orWhere('montant_ttc', '<=', 0);
            });
        }

        $ordres = $query->get();
        $total = $ordres->count();

        if ($total === 0) {
            $this->info('Aucun ordre à recalculer.');
            return Command::SUCCESS;
        }

        $this->info("Ordres à traiter: {$total}");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $updated = 0;
        $errors = 0;

        foreach ($ordres as $ordre) {
            try {
                DB::transaction(function () use ($ordre, $tauxTVA, $tauxCSS, &$updated) {
                    $montantHT = $this->calculerMontantHT($ordre);

                    // Calculer selon la catégorie
                    if ($ordre->categorie === 'non_assujetti') {
                        $montantTVA = 0;
                        $montantCSS = 0;
                    } else {
                        $montantTVA = $montantHT * ($tauxTVA / 100);
                        $montantCSS = $montantHT * ($tauxCSS / 100);
                    }

                    $montantTTC = $montantHT + $montantTVA + $montantCSS;

                    // IMPORTANT: Utiliser les bons noms de colonnes (tva/css, pas montant_tva/montant_css)
                    $ordre->update([
                        'montant_ht' => $montantHT,
                        'tva' => $montantTVA,
                        'css' => $montantCSS,
                        'montant_ttc' => $montantTTC,
                        'taux_tva' => $tauxTVA,
                        'taux_css' => $tauxCSS,
                    ]);

                    $updated++;

                    Log::info('Ordre recalculé', [
                        'ordre_id' => $ordre->id,
                        'numero' => $ordre->numero,
                        'montant_ht' => $montantHT,
                        'tva' => $montantTVA,
                        'css' => $montantCSS,
                        'montant_ttc' => $montantTTC,
                    ]);
                });
            } catch (\Throwable $e) {
                $errors++;
                Log::error('Erreur recalcul ordre', [
                    'ordre_id' => $ordre->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("Résultat: {$updated} ordres mis à jour, {$errors} erreurs");

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Calculer le montant HT selon la catégorie
     */
    protected function calculerMontantHT(OrdreTravail $ordre): float
    {
        $montant = 0;

        // Lignes directes
        foreach ($ordre->lignes as $ligne) {
            $montant += ($ligne->quantite ?? 1) * ($ligne->prix_unitaire ?? 0);
        }

        // Opérations des conteneurs
        foreach ($ordre->conteneurs as $conteneur) {
            foreach ($conteneur->operations as $op) {
                $montant += ($op->quantite ?? 1) * ($op->prix_unitaire ?? 0);
            }
        }

        // Lots
        foreach ($ordre->lots as $lot) {
            $montant += ($lot->quantite ?? 1) * ($lot->prix_unitaire ?? 0);
        }

        return $montant;
    }
}
