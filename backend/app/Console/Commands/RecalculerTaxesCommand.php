<?php

namespace App\Console\Commands;

use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Models\Taxe;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecalculerTaxesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'taxes:recalculer 
                            {--type= : Type de document (factures, ordres, all)}
                            {--from= : Date début au format YYYY-MM-DD}
                            {--to= : Date fin au format YYYY-MM-DD}
                            {--dry-run : Simuler sans appliquer les changements}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculer les taxes (TVA, CSS) sur les factures et ordres de travail existants';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $type = $this->option('type') ?? 'all';
        $from = $this->option('from');
        $to = $this->option('to');
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('🔍 Mode simulation (dry-run) - Aucune modification ne sera appliquée');
        }

        // Récupérer les taux de taxes actifs
        $taxesConfig = $this->getTaxesConfig();
        
        $this->info("📊 Configuration des taxes :");
        $this->table(
            ['Taxe', 'Taux', 'Actif'],
            collect($taxesConfig)->map(fn($config, $code) => [
                strtoupper($code),
                $config['taux'] . '%',
                $config['actif'] ? '✅' : '❌'
            ])->toArray()
        );

        $totalModifies = 0;

        if (in_array($type, ['factures', 'all'])) {
            $count = $this->recalculerFactures($taxesConfig, $from, $to, $dryRun);
            $totalModifies += $count;
        }

        if (in_array($type, ['ordres', 'all'])) {
            $count = $this->recalculerOrdres($taxesConfig, $from, $to, $dryRun);
            $totalModifies += $count;
        }

        $this->newLine();
        if ($dryRun) {
            $this->info("📋 {$totalModifies} document(s) seraient modifié(s)");
        } else {
            $this->info("✅ {$totalModifies} document(s) modifié(s) avec succès");
        }

        return Command::SUCCESS;
    }

    /**
     * Récupérer la configuration des taxes depuis la table taxes
     */
    private function getTaxesConfig(): array
    {
        $config = [
            'tva' => ['taux' => 18, 'actif' => true],
            'css' => ['taux' => 1, 'actif' => true],
        ];

        try {
            $taxes = Taxe::active()->get();
            
            foreach ($taxes as $taxe) {
                $code = strtolower($taxe->code);
                if (in_array($code, ['tva', 'css'])) {
                    $config[$code] = [
                        'taux' => (float) $taxe->taux,
                        'actif' => $taxe->active,
                    ];
                }
            }
        } catch (\Exception $e) {
            $this->warn("⚠️ Table taxes non disponible, utilisation des valeurs par défaut");
        }

        return $config;
    }

    /**
     * Recalculer les taxes sur les factures
     */
    private function recalculerFactures(array $taxesConfig, ?string $from, ?string $to, bool $dryRun): int
    {
        $this->info("\n📄 Recalcul des factures...");

        $query = Facture::query();
        
        if ($from) {
            $query->whereDate('date_creation', '>=', $from);
        }
        if ($to) {
            $query->whereDate('date_creation', '<=', $to);
        }

        $factures = $query->get();
        $this->info("   Factures à traiter : {$factures->count()}");

        $modifies = 0;
        $progressBar = $this->output->createProgressBar($factures->count());

        foreach ($factures as $facture) {
            $result = $this->recalculerDocument($facture, $taxesConfig, $dryRun);
            if ($result) {
                $modifies++;
            }
            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();

        return $modifies;
    }

    /**
     * Recalculer les taxes sur les ordres de travail
     */
    private function recalculerOrdres(array $taxesConfig, ?string $from, ?string $to, bool $dryRun): int
    {
        $this->info("\n📋 Recalcul des ordres de travail...");

        $query = OrdreTravail::query();
        
        if ($from) {
            $query->whereDate('date_creation', '>=', $from);
        }
        if ($to) {
            $query->whereDate('date_creation', '<=', $to);
        }

        $ordres = $query->get();
        $this->info("   Ordres à traiter : {$ordres->count()}");

        $modifies = 0;
        $progressBar = $this->output->createProgressBar($ordres->count());

        foreach ($ordres as $ordre) {
            $result = $this->recalculerDocument($ordre, $taxesConfig, $dryRun);
            if ($result) {
                $modifies++;
            }
            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();

        return $modifies;
    }

    /**
     * Recalculer les taxes d'un document
     */
    private function recalculerDocument($document, array $taxesConfig, bool $dryRun): bool
    {
        $montantHT = (float) $document->montant_ht;
        $remiseMontant = (float) ($document->remise_montant ?? 0);
        $montantHTNet = max(0, $montantHT - $remiseMontant);

        // Calculer les nouvelles taxes
        $nouvelleTVA = 0;
        $nouveauCSS = 0;

        // TVA
        if ($taxesConfig['tva']['actif'] && !($document->exonere_tva ?? false)) {
            $nouvelleTVA = round($montantHTNet * ($taxesConfig['tva']['taux'] / 100), 2);
        }

        // CSS
        if ($taxesConfig['css']['actif'] && !($document->exonere_css ?? false)) {
            $nouveauCSS = round($montantHTNet * ($taxesConfig['css']['taux'] / 100), 2);
        }

        // Calculer le nouveau TTC
        $nouveauTTC = round($montantHTNet + $nouvelleTVA + $nouveauCSS, 2);

        // Vérifier si les valeurs ont changé
        $ancienneTVA = round((float) $document->tva, 2);
        $ancienCSS = round((float) $document->css, 2);
        $ancienTTC = round((float) $document->montant_ttc, 2);

        $hasChanged = (
            $nouvelleTVA !== $ancienneTVA ||
            $nouveauCSS !== $ancienCSS ||
            $nouveauTTC !== $ancienTTC
        );

        if (!$hasChanged) {
            return false;
        }

        if ($dryRun) {
            $this->line("   [{$document->numero}] TVA: {$ancienneTVA} → {$nouvelleTVA}, CSS: {$ancienCSS} → {$nouveauCSS}, TTC: {$ancienTTC} → {$nouveauTTC}");
        } else {
            try {
                $document->update([
                    'tva' => $nouvelleTVA,
                    'css' => $nouveauCSS,
                    'montant_ttc' => $nouveauTTC,
                    'taux_tva' => $taxesConfig['tva']['taux'],
                    'taux_css' => $taxesConfig['css']['taux'],
                ]);

                Log::info("Taxes recalculées", [
                    'document' => $document->numero,
                    'type' => get_class($document),
                    'ancienne_tva' => $ancienneTVA,
                    'nouvelle_tva' => $nouvelleTVA,
                    'ancien_css' => $ancienCSS,
                    'nouveau_css' => $nouveauCSS,
                ]);
            } catch (\Exception $e) {
                $this->error("   Erreur sur {$document->numero}: {$e->getMessage()}");
                return false;
            }
        }

        return true;
    }
}
