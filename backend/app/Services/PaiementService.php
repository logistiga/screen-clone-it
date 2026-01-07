<?php

namespace App\Services;

use App\Models\Paiement;
use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Models\MouvementCaisse;
use App\Models\Banque;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaiementService
{
    protected FactureService $factureService;
    protected OrdreTravailService $ordreService;

    public function __construct(FactureService $factureService, OrdreTravailService $ordreService)
    {
        $this->factureService = $factureService;
        $this->ordreService = $ordreService;
    }

    /**
     * Créer un nouveau paiement
     */
    public function creer(array $data): Paiement
    {
        return DB::transaction(function () use ($data) {
            // Créer le paiement
            $paiement = Paiement::create($data);

            // Enregistrer le paiement sur la facture ou l'ordre
            if ($paiement->facture_id) {
                $facture = Facture::find($paiement->facture_id);
                $this->factureService->enregistrerPaiement($facture, $paiement->montant);
            }
            
            if ($paiement->ordre_id) {
                $ordre = OrdreTravail::find($paiement->ordre_id);
                $this->ordreService->enregistrerPaiement($ordre, $paiement->montant);
            }

            // Créer le mouvement de caisse
            $this->creerMouvementCaisse($paiement);

            // Mettre à jour le solde bancaire si applicable
            if ($paiement->banque_id) {
                $this->mettreAJourSoldeBanque($paiement->banque_id, $paiement->montant, 'credit');
            }

            Log::info('Paiement créé', [
                'paiement_id' => $paiement->id,
                'montant' => $paiement->montant,
                'facture_id' => $paiement->facture_id,
                'ordre_id' => $paiement->ordre_id,
            ]);

            return $paiement->fresh(['facture', 'ordre', 'client', 'banque']);
        });
    }

    /**
     * Créer un paiement global (plusieurs factures/ordres)
     */
    public function creerPaiementGlobal(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $paiements = [];
            $montantRestant = $data['montant'];

            // Payer les factures
            if (!empty($data['factures'])) {
                foreach ($data['factures'] as $factureData) {
                    $facture = Facture::find($factureData['id']);
                    if (!$facture) continue;

                    $montantAPayer = min($factureData['montant'] ?? $facture->reste_a_payer, $montantRestant);
                    if ($montantAPayer <= 0) continue;

                    $paiement = $this->creer([
                        'facture_id' => $facture->id,
                        'client_id' => $data['client_id'],
                        'montant' => $montantAPayer,
                        'date' => $data['date'],
                        'mode_paiement' => $data['mode_paiement'],
                        'reference' => $data['reference'] ?? null,
                        'banque_id' => $data['banque_id'] ?? null,
                        'numero_cheque' => $data['numero_cheque'] ?? null,
                        'notes' => $data['notes'] ?? null,
                    ]);

                    $paiements[] = $paiement;
                    $montantRestant -= $montantAPayer;
                }
            }

            // Payer les ordres
            if (!empty($data['ordres'])) {
                foreach ($data['ordres'] as $ordreData) {
                    $ordre = OrdreTravail::find($ordreData['id']);
                    if (!$ordre) continue;

                    $montantAPayer = min($ordreData['montant'] ?? $ordre->reste_a_payer, $montantRestant);
                    if ($montantAPayer <= 0) continue;

                    $paiement = $this->creer([
                        'ordre_id' => $ordre->id,
                        'client_id' => $data['client_id'],
                        'montant' => $montantAPayer,
                        'date' => $data['date'],
                        'mode_paiement' => $data['mode_paiement'],
                        'reference' => $data['reference'] ?? null,
                        'banque_id' => $data['banque_id'] ?? null,
                        'numero_cheque' => $data['numero_cheque'] ?? null,
                        'notes' => $data['notes'] ?? null,
                    ]);

                    $paiements[] = $paiement;
                    $montantRestant -= $montantAPayer;
                }
            }

            Log::info('Paiement global créé', [
                'nombre_paiements' => count($paiements),
                'montant_total' => $data['montant'],
                'montant_restant' => $montantRestant,
            ]);

            return $paiements;
        });
    }

    /**
     * Annuler un paiement
     */
    public function annuler(Paiement $paiement): void
    {
        DB::transaction(function () use ($paiement) {
            // Inverser le paiement sur la facture
            if ($paiement->facture_id) {
                $facture = $paiement->facture;
                $nouveauMontantPaye = max(0, $facture->montant_paye - $paiement->montant);
                
                $statut = 'validee';
                if ($nouveauMontantPaye > 0) {
                    $statut = 'partiellement_payee';
                }

                $facture->update([
                    'montant_paye' => $nouveauMontantPaye,
                    'statut' => $statut,
                ]);

                $this->factureService->mettreAJourSoldeClient($facture->client_id);
            }

            // Inverser le paiement sur l'ordre
            if ($paiement->ordre_id) {
                $ordre = $paiement->ordre;
                $nouveauMontantPaye = max(0, $ordre->montant_paye - $paiement->montant);
                
                $ordre->update([
                    'montant_paye' => $nouveauMontantPaye,
                ]);
            }

            // Créer un mouvement de caisse d'annulation
            MouvementCaisse::create([
                'type' => 'sortie',
                'montant' => $paiement->montant,
                'date' => now(),
                'description' => 'Annulation paiement ' . ($paiement->facture ? $paiement->facture->numero : $paiement->ordre->numero),
                'source' => $paiement->banque_id ? 'banque' : 'caisse',
                'banque_id' => $paiement->banque_id,
            ]);

            // Inverser le solde bancaire si applicable
            if ($paiement->banque_id) {
                $this->mettreAJourSoldeBanque($paiement->banque_id, $paiement->montant, 'debit');
            }

            // Supprimer le paiement
            $paiement->delete();

            Log::info('Paiement annulé', ['paiement_id' => $paiement->id]);
        });
    }

    /**
     * Créer un mouvement de caisse pour un paiement
     */
    protected function creerMouvementCaisse(Paiement $paiement): MouvementCaisse
    {
        $description = 'Paiement ';
        if ($paiement->facture) {
            $description .= $paiement->facture->numero;
        } elseif ($paiement->ordre) {
            $description .= $paiement->ordre->numero;
        }

        return MouvementCaisse::create([
            'type' => 'entree',
            'montant' => $paiement->montant,
            'date' => $paiement->date,
            'description' => $description,
            'paiement_id' => $paiement->id,
            'source' => $paiement->banque_id ? 'banque' : 'caisse',
            'banque_id' => $paiement->banque_id,
        ]);
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

    /**
     * Obtenir les statistiques de paiement pour un client
     */
    public function getStatistiquesClient(int $clientId): array
    {
        $totalPaiements = Paiement::where('client_id', $clientId)->sum('montant');
        
        $paiementsParMois = Paiement::where('client_id', $clientId)
            ->selectRaw('YEAR(date) as annee, MONTH(date) as mois, SUM(montant) as total')
            ->groupBy('annee', 'mois')
            ->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->limit(12)
            ->get();

        $paiementsParMode = Paiement::where('client_id', $clientId)
            ->selectRaw('mode_paiement, SUM(montant) as total, COUNT(*) as nombre')
            ->groupBy('mode_paiement')
            ->get();

        return [
            'total' => $totalPaiements,
            'par_mois' => $paiementsParMois,
            'par_mode' => $paiementsParMode,
        ];
    }
}
