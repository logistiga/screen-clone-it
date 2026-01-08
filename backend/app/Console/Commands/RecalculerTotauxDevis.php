<?php

namespace App\Console\Commands;

use App\Models\Devis;
use App\Models\Configuration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecalculerTotauxDevis extends Command
{
    protected $signature = 'devis:recalculer-totaux {--all : Recalculer tous les devis, pas seulement ceux à zéro}';
    protected $description = 'Recalcule les totaux (HT, TVA, CSS, TTC) pour les devis dont les montants sont à zéro';

    public function handle(): int
    {
        $this->info('=== Recalcul des totaux des devis ===');

        // Récupérer les taux de taxes
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;

        $this->info("Taux TVA: {$tauxTVA}% | Taux CSS: {$tauxCSS}%");

        // Sélectionner les devis à recalculer
        $query = Devis::with(['conteneurs.operations', 'lots', 'lignes']);
        
        if (!$this->option('all')) {
            $query->where(function ($q) {
                $q->whereNull('montant_ttc')
                  ->orWhere('montant_ttc', 0)
                  ->orWhere('montant_ttc', '<=', 0);
            });
        }

        $devis = $query->get();
        $total = $devis->count();

        if ($total === 0) {
            $this->info('Aucun devis à recalculer.');
            return Command::SUCCESS;
        }

        $this->info("Devis à traiter: {$total}");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $updated = 0;
        $errors = 0;

        foreach ($devis as $d) {
            try {
                DB::transaction(function () use ($d, $tauxTVA, $tauxCSS, &$updated) {
                    $montantHT = $this->calculerMontantHT($d);

                    $montantTVA = $montantHT * ($tauxTVA / 100);
                    $montantCSS = $montantHT * ($tauxCSS / 100);
                    $montantTTC = $montantHT + $montantTVA + $montantCSS;

                    $d->update([
                        'montant_ht' => $montantHT,
                        'tva' => $montantTVA,
                        'css' => $montantCSS,
                        'montant_ttc' => $montantTTC,
                    ]);

                    $updated++;

                    Log::info('Devis recalculé', [
                        'devis_id' => $d->id,
                        'numero' => $d->numero,
                        'montant_ht' => $montantHT,
                        'montant_ttc' => $montantTTC,
                    ]);
                });
            } catch (\Throwable $e) {
                $errors++;
                Log::error('Erreur recalcul devis', [
                    'devis_id' => $d->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("Résultat: {$updated} devis mis à jour, {$errors} erreurs");

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Calculer le montant HT selon la catégorie du devis
     */
    protected function calculerMontantHT(Devis $devis): float
    {
        $montant = 0;

        switch ($devis->categorie) {
            case 'conteneurs':
                foreach ($devis->conteneurs as $conteneur) {
                    foreach ($conteneur->operations as $op) {
                        $montant += ($op->quantite ?? 1) * ($op->prix_unitaire ?? 0);
                    }
                }
                break;

            case 'conventionnel':
                foreach ($devis->lots as $lot) {
                    $montant += ($lot->quantite ?? 1) * ($lot->prix_unitaire ?? 0);
                }
                break;

            case 'operations_independantes':
                foreach ($devis->lignes as $ligne) {
                    $montant += ($ligne->quantite ?? 1) * ($ligne->prix_unitaire ?? 0);
                }
                break;

            default:
                // Essayer toutes les sources
                foreach ($devis->conteneurs as $conteneur) {
                    foreach ($conteneur->operations as $op) {
                        $montant += ($op->quantite ?? 1) * ($op->prix_unitaire ?? 0);
                    }
                }
                foreach ($devis->lots as $lot) {
                    $montant += ($lot->quantite ?? 1) * ($lot->prix_unitaire ?? 0);
                }
                foreach ($devis->lignes as $ligne) {
                    $montant += ($ligne->quantite ?? 1) * ($ligne->prix_unitaire ?? 0);
                }
        }

        return $montant;
    }
}
