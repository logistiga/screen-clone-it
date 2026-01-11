<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\OrdreTravail;
use App\Models\Facture;
use App\Models\Devis;
use App\Models\Annulation;

class SynchroniserAnnulations extends Command
{
    protected $signature = 'annulations:sync';
    protected $description = 'Synchronise les documents annulés avec la table annulations';

    public function handle()
    {
        $this->info('Synchronisation des annulations...');

        $count = 0;

        // Ordres annulés sans enregistrement d'annulation
        $ordresAnnules = OrdreTravail::where('statut', 'annule')
            ->whereDoesntHave('annulation')
            ->get();

        foreach ($ordresAnnules as $ordre) {
            Annulation::create([
                'numero' => Annulation::genererNumero(),
                'type' => 'ordre',
                'document_id' => $ordre->id,
                'document_numero' => $ordre->numero,
                'client_id' => $ordre->client_id,
                'montant' => $ordre->montant_ttc ?? 0,
                'date' => $ordre->updated_at ?? now(),
                'motif' => 'Annulation synchronisée automatiquement',
                'avoir_genere' => false,
            ]);
            $count++;
            $this->line("  - Ordre {$ordre->numero} synchronisé");
        }

        // Factures annulées sans enregistrement d'annulation
        $facturesAnnulees = Facture::where('statut', 'annulee')
            ->whereDoesntHave('annulation')
            ->get();

        foreach ($facturesAnnulees as $facture) {
            Annulation::create([
                'numero' => Annulation::genererNumero(),
                'type' => 'facture',
                'document_id' => $facture->id,
                'document_numero' => $facture->numero,
                'client_id' => $facture->client_id,
                'montant' => $facture->montant_ttc ?? 0,
                'date' => $facture->updated_at ?? now(),
                'motif' => 'Annulation synchronisée automatiquement',
                'avoir_genere' => false,
            ]);
            $count++;
            $this->line("  - Facture {$facture->numero} synchronisée");
        }

        // Devis annulés sans enregistrement d'annulation
        $devisAnnules = Devis::where('statut', 'annule')
            ->whereDoesntHave('annulation')
            ->get();

        foreach ($devisAnnules as $devis) {
            Annulation::create([
                'numero' => Annulation::genererNumero(),
                'type' => 'devis',
                'document_id' => $devis->id,
                'document_numero' => $devis->numero,
                'client_id' => $devis->client_id,
                'montant' => $devis->montant_ttc ?? 0,
                'date' => $devis->updated_at ?? now(),
                'motif' => 'Annulation synchronisée automatiquement',
                'avoir_genere' => false,
            ]);
            $count++;
            $this->line("  - Devis {$devis->numero} synchronisé");
        }

        $this->info("Terminé! {$count} annulation(s) synchronisée(s).");

        return 0;
    }
}
