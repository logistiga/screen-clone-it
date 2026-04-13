<?php

namespace App\Console\Commands;

use App\Models\Facture;
use App\Services\Facture\FactureServiceFactory;
use App\Support\DocumentCategory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RecalculerTotauxFactures extends Command
{
    protected $signature = 'factures:recalculer-totaux {--all : Recalculer toutes les factures, pas seulement celles à zéro} {--id= : Recalculer une facture spécifique par ID}';
    protected $description = 'Recalcule les totaux (HT, TVA, CSS, TTC) pour les factures via les services spécialisés';

    public function handle(): int
    {
        $this->info('=== Recalcul des totaux des factures (via services) ===');

        $factureFactory = app(FactureServiceFactory::class);

        $query = Facture::with(['conteneurs.operations', 'lots', 'lignes']);

        if ($this->option('id')) {
            $query->where('id', $this->option('id'));
        } elseif (!$this->option('all')) {
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
                $categorie = DocumentCategory::normalize($facture->categorie);
                $service = $factureFactory->getService($categorie);

                $ancienTTC = $facture->montant_ttc;
                $service->calculerTotaux($facture);
                $facture->refresh();

                $this->newLine();
                $this->line("  [{$facture->numero}] cat={$categorie} | HT={$facture->montant_ht} TVA={$facture->tva} CSS={$facture->css} TTC={$facture->montant_ttc} (avant: {$ancienTTC})");
                $this->line("    conteneurs=" . $facture->conteneurs->count() . " lots=" . $facture->lots->count() . " lignes=" . $facture->lignes->count());

                $updated++;

                Log::info('Facture recalculée via service', [
                    'facture_id' => $facture->id,
                    'numero' => $facture->numero,
                    'categorie' => $categorie,
                    'montant_ht' => $facture->montant_ht,
                    'tva' => $facture->tva,
                    'css' => $facture->css,
                    'montant_ttc' => $facture->montant_ttc,
                    'ancien_ttc' => $ancienTTC,
                ]);
            } catch (\Throwable $e) {
                $errors++;
                $this->newLine();
                $this->error("  Erreur [{$facture->numero}]: {$e->getMessage()}");
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
}
