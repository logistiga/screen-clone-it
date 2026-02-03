<?php

namespace App\Services;

use App\Models\Annulation;
use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Models\Devis;
use App\Models\MouvementCaisse;
use App\Models\Configuration;
use App\Services\Facture\FactureServiceFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnnulationService
{
    protected FactureServiceFactory $factureFactory;

    public function __construct(FactureServiceFactory $factureFactory)
    {
        $this->factureFactory = $factureFactory;
    }

    /**
     * Annuler une facture
     */
    public function annulerFacture(Facture $facture, string $motif, bool $genererAvoir = false): Annulation
    {
        return DB::transaction(function () use ($facture, $motif, $genererAvoir) {
            // Vérifier que la facture peut être annulée
            if ($facture->statut === 'annulee') {
                throw new \Exception('Cette facture est déjà annulée.');
            }

            // Créer l'annulation
            $annulation = Annulation::create([
                'numero' => Annulation::genererNumero(),
                'type' => 'facture',
                'document_id' => $facture->id,
                'document_numero' => $facture->numero,
                'client_id' => $facture->client_id,
                'montant' => $facture->montant_ttc,
                'date' => now(),
                'motif' => $motif,
                'avoir_genere' => $genererAvoir,
                'numero_avoir' => $genererAvoir ? Annulation::genererNumeroAvoir() : null,
            ]);

            // Annuler les paiements liés
            $this->annulerPaiementsFacture($facture);

            // Mettre à jour le statut de la facture
            $facture->update(['statut' => 'annulee']);

            // Mettre à jour le solde client
            $this->factureFactory->mettreAJourSoldeClient($facture->client_id);

            Log::info('Facture annulée', [
                'facture_id' => $facture->id,
                'facture_numero' => $facture->numero,
                'annulation_id' => $annulation->id,
                'avoir_genere' => $genererAvoir,
            ]);

            return $annulation;
        });
    }

    /**
     * Annuler un ordre de travail
     */
    public function annulerOrdre(OrdreTravail $ordre, string $motif): Annulation
    {
        return DB::transaction(function () use ($ordre, $motif) {
            // Vérifier que l'ordre peut être annulé
            if ($ordre->statut === 'annule') {
                throw new \Exception('Cet ordre de travail est déjà annulé.');
            }

            if ($ordre->statut === 'facture') {
                throw new \Exception('Impossible d\'annuler un ordre déjà facturé. Annulez d\'abord la facture.');
            }

            // Calculer le montant avec fallback robuste
            // Pour les ordres sans taxes: montant_ttc = montant_ht
            $montantHT = (float) ($ordre->montant_ht ?? 0);
            $montantTVA = (float) ($ordre->tva ?? 0);
            $montantCSS = (float) ($ordre->css ?? 0);
            
            // Priorité: montant_ttc > calcul manuel
            $montant = $ordre->montant_ttc ?? ($montantHT + $montantTVA + $montantCSS);
            
            // Si tout est à zéro mais qu'il y a un montant_ht, utiliser le HT
            if ($montant == 0 && $montantHT > 0) {
                $montant = $montantHT;
            }

            // Créer l'annulation
            $annulation = Annulation::create([
                'numero' => Annulation::genererNumero(),
                'type' => 'ordre',
                'document_id' => $ordre->id,
                'document_numero' => $ordre->numero,
                'client_id' => $ordre->client_id,
                'montant' => $montant,
                'date' => now(),
                'motif' => $motif,
                'avoir_genere' => false,
            ]);

            // Mettre à jour le statut de l'ordre
            $ordre->update(['statut' => 'annule']);

            Log::info('Ordre de travail annulé', [
                'ordre_id' => $ordre->id,
                'ordre_numero' => $ordre->numero,
                'annulation_id' => $annulation->id,
            ]);

            return $annulation;
        });
    }

    /**
     * Annuler un devis
     */
    public function annulerDevis(Devis $devis, string $motif): Annulation
    {
        return DB::transaction(function () use ($devis, $motif) {
            // Vérifier que le devis peut être annulé
            if ($devis->statut === 'annule') {
                throw new \Exception('Ce devis est déjà annulé.');
            }

            if ($devis->statut === 'converti') {
                throw new \Exception('Impossible d\'annuler un devis converti en ordre.');
            }

            // Créer l'annulation
            $annulation = Annulation::create([
                'numero' => Annulation::genererNumero(),
                'type' => 'devis',
                'document_id' => $devis->id,
                'document_numero' => $devis->numero,
                'client_id' => $devis->client_id,
                'montant' => $devis->montant_ttc,
                'date' => now(),
                'motif' => $motif,
                'avoir_genere' => false,
            ]);

            // Mettre à jour le statut du devis
            $devis->update(['statut' => 'annule']);

            Log::info('Devis annulé', [
                'devis_id' => $devis->id,
                'devis_numero' => $devis->numero,
                'annulation_id' => $annulation->id,
            ]);

            return $annulation;
        });
    }

    /**
     * Annuler les paiements liés à une facture
     */
    protected function annulerPaiementsFacture(Facture $facture): void
    {
        foreach ($facture->paiements as $paiement) {
            // Créer un mouvement de caisse d'annulation
            MouvementCaisse::create([
                'type' => 'sortie',
                'montant' => $paiement->montant,
                'date' => now(),
                'description' => "Annulation paiement - Facture {$facture->numero}",
                'source' => $paiement->banque_id ? 'banque' : 'caisse',
                'banque_id' => $paiement->banque_id,
            ]);

            // Mettre à jour le solde bancaire si applicable
            if ($paiement->banque_id) {
                $paiement->banque->decrement('solde', $paiement->montant);
            }

            // Supprimer le paiement
            $paiement->delete();
        }
    }

    /**
     * Obtenir les statistiques d'annulation
     */
    public function getStatistiques(array $filters = []): array
    {
        $query = Annulation::query();

        if (!empty($filters['date_debut'])) {
            $query->where('date', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->where('date', '<=', $filters['date_fin']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        $total = $query->count();
        $montantTotal = $query->sum('montant');

        $parType = Annulation::selectRaw('type, COUNT(*) as nombre, SUM(montant) as montant_total')
            ->when(!empty($filters['date_debut']), fn($q) => $q->where('date', '>=', $filters['date_debut']))
            ->when(!empty($filters['date_fin']), fn($q) => $q->where('date', '<=', $filters['date_fin']))
            ->groupBy('type')
            ->get();

        $parMois = Annulation::selectRaw('YEAR(date) as annee, MONTH(date) as mois, COUNT(*) as nombre, SUM(montant) as montant_total')
            ->when(!empty($filters['date_debut']), fn($q) => $q->where('date', '>=', $filters['date_debut']))
            ->when(!empty($filters['date_fin']), fn($q) => $q->where('date', '<=', $filters['date_fin']))
            ->groupBy('annee', 'mois')
            ->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->limit(12)
            ->get();

        $avoirs = Annulation::where('avoir_genere', true)
            ->when(!empty($filters['date_debut']), fn($q) => $q->where('date', '>=', $filters['date_debut']))
            ->when(!empty($filters['date_fin']), fn($q) => $q->where('date', '<=', $filters['date_fin']))
            ->count();

        return [
            'total' => $total,
            'montant_total' => $montantTotal,
            'avoirs_generes' => $avoirs,
            'par_type' => $parType,
            'par_mois' => $parMois,
        ];
    }

    /**
     * Obtenir l'historique des annulations pour un client
     */
    public function getHistoriqueClient(int $clientId): array
    {
        $annulations = Annulation::where('client_id', $clientId)
            ->orderBy('date', 'desc')
            ->get();

        $stats = [
            'total' => $annulations->count(),
            'montant_total' => $annulations->sum('montant'),
            'par_type' => $annulations->groupBy('type')->map(fn($items) => [
                'nombre' => $items->count(),
                'montant' => $items->sum('montant'),
            ]),
        ];

        return [
            'annulations' => $annulations,
            'statistiques' => $stats,
        ];
    }
}
