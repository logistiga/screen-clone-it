<?php

namespace App\Console\Commands;

use App\Models\OrdreTravail;
use App\Services\OrdreTravail\OrdreConversionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReconvertirFacturesDepuisOrdres extends Command
{
    protected $signature = 'ordres:reconvertir-factures
                            {--all : Resynchroniser tous les ordres déjà convertis en facture}
                            {--ordre-id= : Reconvertir un ordre spécifique par ID}
                            {--facture-id= : Reconvertir via une facture spécifique par ID}';

    protected $description = 'Reconstruit les factures existantes depuis leurs ordres de travail source pour corriger les montants à zéro';

    public function handle(): int
    {
        $this->info('=== Reconversion OT → facture ===');

        /** @var OrdreConversionService $conversionService */
        $conversionService = app(OrdreConversionService::class);

        $query = OrdreTravail::with(['facture', 'conteneurs.operations', 'lots', 'lignes']);

        if ($ordreId = $this->option('ordre-id')) {
            $query->whereKey($ordreId);
        } elseif ($factureId = $this->option('facture-id')) {
            $query->whereHas('facture', function ($q) use ($factureId) {
                $q->whereKey($factureId);
            });
        } elseif (!$this->option('all')) {
            $query->whereHas('facture', function ($q) {
                $q->where(function ($subQuery) {
                    $subQuery->whereNull('montant_ttc')
                        ->orWhere('montant_ttc', 0)
                        ->orWhere('montant_ttc', '<=', 0);
                });
            });
        } else {
            $query->whereHas('facture');
        }

        $ordres = $query->orderBy('id')->get();
        $total = $ordres->count();

        if ($total === 0) {
            $this->info('Aucun ordre à reconvertir.');
            return Command::SUCCESS;
        }

        $this->info("Ordres à traiter: {$total}");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $updated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($ordres as $ordre) {
            try {
                $result = DB::transaction(function () use ($ordre, $conversionService) {
                    $ordre->load(['facture', 'conteneurs.operations', 'lots', 'lignes']);

                    if (!$ordre->facture) {
                        return [
                            'status' => 'skipped',
                            'message' => "Ordre {$ordre->numero} sans facture liée",
                        ];
                    }

                    $factureAvant = $ordre->facture;
                    $ancienTTC = (float) ($factureAvant->montant_ttc ?? 0);

                    $service = $conversionService->getService($ordre->categorie);
                    $service->calculerTotaux($ordre);

                    $ordre->refresh();
                    $ordre->load(['facture', 'conteneurs.operations', 'lots', 'lignes']);

                    $conversionService->synchroniserFacture($ordre, []);

                    $factureApres = $ordre->facture()->with(['conteneurs.operations', 'lots', 'lignes'])->first();
                    $nbElements = $factureApres->conteneurs->count() + $factureApres->lots->count() + $factureApres->lignes->count();

                    return [
                        'status' => 'updated',
                        'ordre_numero' => $ordre->numero,
                        'facture_numero' => $factureApres->numero,
                        'ancien_ttc' => $ancienTTC,
                        'nouveau_ttc' => (float) ($factureApres->montant_ttc ?? 0),
                        'ordre_ht' => (float) ($ordre->montant_ht ?? 0),
                        'elements' => $nbElements,
                    ];
                });

                if ($result['status'] === 'skipped') {
                    $skipped++;
                    $this->newLine();
                    $this->warn('  ' . $result['message']);
                } else {
                    $updated++;
                    $this->newLine();
                    $this->line("  [{$result['ordre_numero']}] → {$result['facture_numero']} | TTC: {$result['ancien_ttc']} → {$result['nouveau_ttc']} | éléments={$result['elements']}");

                    if ($result['elements'] > 0 && $result['nouveau_ttc'] <= 0) {
                        $this->warn('    Attention: la facture a encore un total à 0 après reconversion.');
                    }

                    Log::info('Facture reconvertie depuis ordre', [
                        'ordre_numero' => $result['ordre_numero'],
                        'facture_numero' => $result['facture_numero'],
                        'ancien_ttc' => $result['ancien_ttc'],
                        'nouveau_ttc' => $result['nouveau_ttc'],
                        'ordre_ht' => $result['ordre_ht'],
                        'elements' => $result['elements'],
                    ]);
                }
            } catch (\Throwable $e) {
                $errors++;
                $this->newLine();
                $this->error("  Erreur [OT {$ordre->numero}]: {$e->getMessage()}");

                Log::error('Erreur reconversion OT → facture', [
                    'ordre_id' => $ordre->id,
                    'ordre_numero' => $ordre->numero,
                    'error' => $e->getMessage(),
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Résultat: {$updated} factures resynchronisées, {$skipped} ignorées, {$errors} erreurs");

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}