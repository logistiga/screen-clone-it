<?php

namespace App\Services;

use App\Models\MouvementCaisse;
use App\Models\Banque;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CaisseService
{
    /**
     * Créer une entrée en caisse
     */
    public function creerEntree(array $data): MouvementCaisse
    {
        return $this->creerMouvement('entree', $data);
    }

    /**
     * Créer une sortie de caisse
     */
    public function creerSortie(array $data): MouvementCaisse
    {
        return $this->creerMouvement('sortie', $data);
    }

    /**
     * Créer un mouvement de caisse
     */
    protected function creerMouvement(string $type, array $data): MouvementCaisse
    {
        return DB::transaction(function () use ($type, $data) {
            $data['type'] = $type;

            $mouvement = MouvementCaisse::create($data);

            // Mettre à jour le solde bancaire si applicable
            if (!empty($data['banque_id'])) {
                $this->mettreAJourSoldeBanque(
                    $data['banque_id'],
                    $data['montant'],
                    $type === 'entree' ? 'credit' : 'debit'
                );
            }

            Log::info('Mouvement de caisse créé', [
                'mouvement_id' => $mouvement->id,
                'type' => $type,
                'montant' => $mouvement->montant,
            ]);

            return $mouvement->fresh(['banque']);
        });
    }

    /**
     * Transférer entre caisse et banque
     */
    public function transferer(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $mouvements = [];

            // Sortie de la source
            $sortie = MouvementCaisse::create([
                'type' => 'sortie',
                'montant' => $data['montant'],
                'date' => $data['date'],
                'description' => 'Transfert vers ' . ($data['destination_banque_id'] ? 'banque' : 'caisse'),
                'source' => $data['source_banque_id'] ? 'banque' : 'caisse',
                'banque_id' => $data['source_banque_id'] ?? null,
            ]);
            $mouvements[] = $sortie;

            // Entrée à la destination
            $entree = MouvementCaisse::create([
                'type' => 'entree',
                'montant' => $data['montant'],
                'date' => $data['date'],
                'description' => 'Transfert depuis ' . ($data['source_banque_id'] ? 'banque' : 'caisse'),
                'source' => $data['destination_banque_id'] ? 'banque' : 'caisse',
                'banque_id' => $data['destination_banque_id'] ?? null,
            ]);
            $mouvements[] = $entree;

            // Mettre à jour les soldes bancaires
            if ($data['source_banque_id']) {
                $this->mettreAJourSoldeBanque($data['source_banque_id'], $data['montant'], 'debit');
            }
            if ($data['destination_banque_id']) {
                $this->mettreAJourSoldeBanque($data['destination_banque_id'], $data['montant'], 'credit');
            }

            Log::info('Transfert effectué', [
                'montant' => $data['montant'],
                'source_banque_id' => $data['source_banque_id'] ?? 'caisse',
                'destination_banque_id' => $data['destination_banque_id'] ?? 'caisse',
            ]);

            return $mouvements;
        });
    }

    /**
     * Obtenir le solde de la caisse
     */
    public function getSoldeCaisse(): float
    {
        $entrees = MouvementCaisse::where('source', 'caisse')
            ->where('type', 'entree')
            ->sum('montant');

        $sorties = MouvementCaisse::where('source', 'caisse')
            ->where('type', 'sortie')
            ->sum('montant');

        return $entrees - $sorties;
    }

    /**
     * Obtenir le solde global (caisse + banques)
     */
    public function getSoldeGlobal(): array
    {
        $soldeCaisse = $this->getSoldeCaisse();
        $soldeBanques = Banque::sum('solde');

        return [
            'caisse' => $soldeCaisse,
            'banques' => $soldeBanques,
            'total' => $soldeCaisse + $soldeBanques,
        ];
    }

    /**
     * Obtenir les mouvements avec filtres
     */
    public function getMouvements(array $filters = [])
    {
        $query = MouvementCaisse::with([
            'banque',
            'paiement.ordre.client',
            'paiement.facture.client',
            'paiement.client',
        ]);

        if (!empty($filters['type'])) {
            // Normaliser le type (Sortie -> sortie, Entrée -> entree)
            $type = strtolower($filters['type']);
            $type = str_replace(['é', 'è', 'ê', 'ë'], 'e', $type);
            $query->where('type', $type);
        }

        if (!empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        if (!empty($filters['banque_id'])) {
            $query->where('banque_id', $filters['banque_id']);
        }

        if (!empty($filters['date_debut'])) {
            $query->where('date', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->where('date', '<=', $filters['date_fin']);
        }

        return $query->orderBy('date', 'desc')->orderBy('id', 'desc');
    }

    /**
     * Obtenir les statistiques de la caisse
     */
    public function getStatistiques(array $filters = []): array
    {
        $query = MouvementCaisse::query();

        if (!empty($filters['date_debut'])) {
            $query->where('date', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->where('date', '<=', $filters['date_fin']);
        }

        $totalEntrees = (clone $query)->where('type', 'entree')->sum('montant');
        $totalSorties = (clone $query)->where('type', 'sortie')->sum('montant');

        $parMois = MouvementCaisse::selectRaw('
                YEAR(date) as annee, 
                MONTH(date) as mois, 
                type,
                SUM(montant) as total
            ')
            ->groupBy('annee', 'mois', 'type')
            ->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->limit(24)
            ->get();

        return [
            'total_entrees' => $totalEntrees,
            'total_sorties' => $totalSorties,
            'solde_periode' => $totalEntrees - $totalSorties,
            'solde_caisse' => $this->getSoldeCaisse(),
            'par_mois' => $parMois,
        ];
    }

    /**
     * Mettre à jour le solde d'une banque
     */
    protected function mettreAJourSoldeBanque(int $banqueId, float $montant, string $operation): void
    {
        $banque = Banque::find($banqueId);
        if (!$banque) return;

        if ($operation === 'credit') {
            $banque->increment('solde', $montant);
        } else {
            $banque->decrement('solde', $montant);
        }
    }
}
