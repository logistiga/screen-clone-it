<?php

namespace App\Services\Alert;

use App\Models\Facture;
use App\Models\Devis;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Génération des alertes automatiques : factures en retard, échéances crédit, devis expirants
 */
class AlertGeneratorService
{
    public function generateFacturesEnRetardAlerts(): array
    {
        $alerts = [];
        try {
            $facturesEnRetard = Facture::where('statut', '!=', 'payee')
                ->where('statut', '!=', 'annulee')
                ->where('date_echeance', '<', now())
                ->with('client')
                ->limit(20)
                ->get();

            foreach ($facturesEnRetard as $facture) {
                $joursRetard = Carbon::parse($facture->date_echeance)->diffInDays(now());
                $clientNom = $facture->client->nom ?? $facture->client->raison_sociale ?? 'Client inconnu';
                $resteAPayer = $facture->reste_a_payer ?? ($facture->montant_ttc - ($facture->montant_paye ?? 0));
                
                $alerts[] = [
                    'id' => 'facture_retard_' . $facture->id,
                    'type' => $joursRetard > 30 ? 'error' : 'warning',
                    'title' => 'Facture en retard',
                    'message' => "La facture {$facture->numero} de {$clientNom} est en retard de {$joursRetard} jours. Reste à payer: " . number_format($resteAPayer, 0, ',', ' ') . " FCFA.",
                    'date' => now()->toISOString(),
                    'read' => false,
                    'icon' => 'facture',
                    'link' => "/factures/{$facture->id}",
                    'metadata' => [
                        'facture_id' => $facture->id,
                        'facture_numero' => $facture->numero,
                        'client_id' => $facture->client_id,
                        'jours_retard' => $joursRetard,
                        'montant_du' => $resteAPayer,
                    ],
                ];
            }
        } catch (\Exception $e) {
            \Log::warning('Erreur génération alertes factures: ' . $e->getMessage());
        }
        return $alerts;
    }

    public function generateEcheancesCreditAlerts(): array
    {
        $alerts = [];
        try {
            $echeancesProches = DB::table('echeances_credit')
                ->join('credits_bancaires', 'echeances_credit.credit_bancaire_id', '=', 'credits_bancaires.id')
                ->join('banques', 'credits_bancaires.banque_id', '=', 'banques.id')
                ->where('echeances_credit.statut', 'En attente')
                ->whereBetween('echeances_credit.date_echeance', [now(), now()->addDays(7)])
                ->select('echeances_credit.*', 'credits_bancaires.numero as credit_numero', 'credits_bancaires.objet as credit_objet', 'banques.nom as banque_nom')
                ->limit(10)
                ->get();

            foreach ($echeancesProches as $echeance) {
                $joursRestants = Carbon::parse($echeance->date_echeance)->diffInDays(now());
                $alerts[] = [
                    'id' => 'echeance_' . $echeance->id,
                    'type' => $joursRestants <= 3 ? 'warning' : 'info',
                    'title' => 'Échéance crédit à venir',
                    'message' => "Échéance de " . number_format($echeance->montant, 0, ',', ' ') . " FCFA pour le crédit {$echeance->credit_numero} ({$echeance->banque_nom}) dans {$joursRestants} jours.",
                    'date' => now()->toISOString(),
                    'read' => false,
                    'icon' => 'credit',
                    'link' => "/credits/{$echeance->credit_bancaire_id}",
                    'metadata' => [
                        'echeance_id' => $echeance->id,
                        'credit_id' => $echeance->credit_bancaire_id,
                        'montant' => $echeance->montant,
                        'date_echeance' => $echeance->date_echeance,
                        'jours_restants' => $joursRestants,
                    ],
                ];
            }

            $echeancesRetard = DB::table('echeances_credit')
                ->join('credits_bancaires', 'echeances_credit.credit_bancaire_id', '=', 'credits_bancaires.id')
                ->join('banques', 'credits_bancaires.banque_id', '=', 'banques.id')
                ->where('echeances_credit.statut', 'En retard')
                ->select('echeances_credit.*', 'credits_bancaires.numero as credit_numero', 'banques.nom as banque_nom')
                ->limit(10)
                ->get();

            foreach ($echeancesRetard as $echeance) {
                $joursRetard = Carbon::parse($echeance->date_echeance)->diffInDays(now());
                $alerts[] = [
                    'id' => 'echeance_retard_' . $echeance->id,
                    'type' => 'error',
                    'title' => 'Échéance crédit en retard',
                    'message' => "Échéance de " . number_format($echeance->montant, 0, ',', ' ') . " FCFA en retard de {$joursRetard} jours pour le crédit {$echeance->credit_numero}.",
                    'date' => now()->toISOString(),
                    'read' => false,
                    'icon' => 'credit',
                    'link' => "/credits/{$echeance->credit_bancaire_id}",
                    'metadata' => [
                        'echeance_id' => $echeance->id,
                        'credit_id' => $echeance->credit_bancaire_id,
                        'montant' => $echeance->montant,
                        'jours_retard' => $joursRetard,
                    ],
                ];
            }
        } catch (\Exception $e) {
            \Log::warning('Erreur génération alertes crédits: ' . $e->getMessage());
        }
        return $alerts;
    }

    public function generateDevisExpirantsAlerts(): array
    {
        $alerts = [];
        try {
            $devisExpirants = Devis::whereIn('statut', ['brouillon', 'envoye'])
                ->whereBetween('date_validite', [now(), now()->addDays(5)])
                ->with('client')
                ->limit(10)
                ->get();

            foreach ($devisExpirants as $devis) {
                $joursRestants = Carbon::parse($devis->date_validite)->diffInDays(now());
                $clientNom = $devis->client->nom ?? $devis->client->raison_sociale ?? 'Client inconnu';
                $alerts[] = [
                    'id' => 'devis_expire_' . $devis->id,
                    'type' => 'warning',
                    'title' => 'Devis expirant bientôt',
                    'message' => "Le devis {$devis->numero} pour {$clientNom} expire dans {$joursRestants} jours.",
                    'date' => now()->toISOString(),
                    'read' => false,
                    'icon' => 'devis',
                    'link' => "/devis/{$devis->id}",
                    'metadata' => [
                        'devis_id' => $devis->id,
                        'devis_numero' => $devis->numero,
                        'client_id' => $devis->client_id,
                        'jours_restants' => $joursRestants,
                        'montant_ttc' => $devis->montant_ttc,
                    ],
                ];
            }
        } catch (\Exception $e) {
            \Log::warning('Erreur génération alertes devis: ' . $e->getMessage());
        }
        return $alerts;
    }

    public function generateAllAlerts(): array
    {
        $alerts = array_merge(
            $this->generateFacturesEnRetardAlerts(),
            $this->generateEcheancesCreditAlerts(),
            $this->generateDevisExpirantsAlerts()
        );

        usort($alerts, function ($a, $b) {
            $priority = ['error' => 0, 'warning' => 1, 'info' => 2, 'success' => 3];
            return ($priority[$a['type']] ?? 4) <=> ($priority[$b['type']] ?? 4);
        });

        return $alerts;
    }
}
