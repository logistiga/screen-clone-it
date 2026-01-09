<?php

namespace App\Console\Commands;

use App\Models\Configuration;
use App\Models\Devis;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixCompteurDevis extends Command
{
    protected $signature = 'devis:fix-compteur {--annee= : Année à synchroniser (par défaut année courante)}';

    protected $description = 'Synchronise le compteur prochain_numero_devis avec le plus grand numéro de devis existant.';

    public function handle(): int
    {
        $annee = (string) ($this->option('annee') ?: date('Y'));

        $this->info("Synchronisation du compteur devis pour l'année {$annee}...");

        DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();

            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'],
                ]);
            }

            $max = Devis::whereYear('created_at', $annee)
                ->selectRaw('MAX(CAST(RIGHT(numero, 4) AS UNSIGNED)) as max_num')
                ->value('max_num');

            $prochain = ((int) $max) + 1;

            $data = $config->data;
            $ancien = $data['prochain_numero_devis'] ?? 1;
            $data['prochain_numero_devis'] = $prochain;

            $config->data = $data;
            $config->save();

            $this->info("Compteur devis: {$ancien} → {$prochain}");
        });

        $this->info('OK');

        return self::SUCCESS;
    }
}
