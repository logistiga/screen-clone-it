<?php

namespace App\Console\Commands;

use App\Models\Configuration;
use App\Models\Devis;
use App\Models\Facture;
use App\Models\OrdreTravail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SynchroniserCompteurs extends Command
{
    protected $signature = 'compteurs:sync {--type=all : Type de compteur à synchroniser (all|devis|ordres|factures)}';

    protected $description = 'Synchronise les compteurs de numérotation avec les derniers numéros existants en base';

    public function handle(): int
    {
        $type = $this->option('type');
        $annee = date('Y');

        $this->info("Synchronisation des compteurs pour l'année {$annee}...");

        DB::transaction(function () use ($type, $annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();

            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'],
                ]);
            }

            $data = $config->data;

            if (in_array($type, ['all', 'devis'])) {
                $dernierDevis = Devis::whereYear('created_at', $annee)
                    ->orderBy('id', 'desc')
                    ->first();

                $prochainDevis = 1;
                if ($dernierDevis && preg_match('/-(\d{4})$/', $dernierDevis->numero, $matches)) {
                    $prochainDevis = intval($matches[1]) + 1;
                }

                $ancienDevis = $data['prochain_numero_devis'] ?? 1;
                $data['prochain_numero_devis'] = $prochainDevis;
                $this->info("Compteur Devis: {$ancienDevis} → {$prochainDevis}");
            }

            if (in_array($type, ['all', 'ordres'])) {
                $dernierOrdre = OrdreTravail::whereYear('created_at', $annee)
                    ->orderBy('id', 'desc')
                    ->first();

                $prochainOrdre = 1;
                if ($dernierOrdre && preg_match('/-(\d{4})$/', $dernierOrdre->numero, $matches)) {
                    $prochainOrdre = intval($matches[1]) + 1;
                }

                $ancienOrdre = $data['prochain_numero_ordre'] ?? 1;
                $data['prochain_numero_ordre'] = $prochainOrdre;
                $this->info("Compteur Ordres: {$ancienOrdre} → {$prochainOrdre}");
            }

            if (in_array($type, ['all', 'factures'])) {
                $derniereFacture = Facture::whereYear('created_at', $annee)
                    ->orderBy('id', 'desc')
                    ->first();

                $prochaineFacture = 1;
                if ($derniereFacture && preg_match('/-(\d{4})$/', $derniereFacture->numero, $matches)) {
                    $prochaineFacture = intval($matches[1]) + 1;
                }

                $ancienneFacture = $data['prochain_numero_facture'] ?? 1;
                $data['prochain_numero_facture'] = $prochaineFacture;
                $this->info("Compteur Factures: {$ancienneFacture} → {$prochaineFacture}");
            }

            $config->data = $data;
            $config->save();
        });

        $this->info('Compteurs synchronisés avec succès!');

        return self::SUCCESS;
    }
}
