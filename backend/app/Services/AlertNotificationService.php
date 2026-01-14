<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Facture;
use App\Models\Devis;
use App\Models\Client;
use App\Models\Paiement;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AlertNotificationService
{
    /**
     * Créer une notification pour un utilisateur
     */
    public function create(int $userId, array $data): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $data['type'] ?? 'info',
            'title' => $data['title'],
            'message' => $data['message'],
            'icon' => $data['icon'] ?? null,
            'link' => $data['link'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'read' => false,
        ]);
    }

    /**
     * Créer une notification pour tous les utilisateurs actifs
     */
    public function createForAll(array $data): void
    {
        $users = User::where('actif', true)->get();
        
        foreach ($users as $user) {
            $this->create($user->id, $data);
        }
    }

    /**
     * Créer une notification pour les utilisateurs avec un rôle spécifique
     */
    public function createForRole(string $role, array $data): void
    {
        $users = User::whereHas('roles', function ($query) use ($role) {
            $query->where('name', $role);
        })->where('actif', true)->get();
        
        foreach ($users as $user) {
            $this->create($user->id, $data);
        }
    }

    /**
     * Récupérer les notifications d'un utilisateur
     */
    public function getForUser(int $userId, array $params = []): array
    {
        $query = Notification::where('user_id', $userId)
            ->where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at', 'desc');

        if (!empty($params['unread_only'])) {
            $query->where('read', false);
        }

        if (!empty($params['type'])) {
            $query->where('type', $params['type']);
        }

        $perPage = $params['per_page'] ?? 50;
        $notifications = $query->paginate($perPage);

        $unreadCount = Notification::where('user_id', $userId)
            ->where('read', false)
            ->count();

        return [
            'data' => $notifications->items(),
            'unread_count' => $unreadCount,
            'total' => $notifications->total(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ];
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead(int $notificationId): void
    {
        Notification::where('id', $notificationId)->update(['read' => true]);
    }

    /**
     * Marquer toutes les notifications d'un utilisateur comme lues
     */
    public function markAllAsRead(int $userId): void
    {
        Notification::where('user_id', $userId)
            ->where('read', false)
            ->update(['read' => true]);
    }

    /**
     * Supprimer une notification
     */
    public function delete(int $notificationId): void
    {
        Notification::where('id', $notificationId)->delete();
    }

    /**
     * Supprimer toutes les notifications d'un utilisateur
     */
    public function deleteAll(int $userId): void
    {
        Notification::where('user_id', $userId)->delete();
    }

    /**
     * Générer les alertes automatiques pour les factures en retard
     */
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

    /**
     * Générer les alertes pour les échéances de crédit à venir
     */
    public function generateEcheancesCreditAlerts(): array
    {
        $alerts = [];
        
        try {
            // Échéances dans les 7 prochains jours
            $echeancesProches = DB::table('echeances_credit')
                ->join('credits_bancaires', 'echeances_credit.credit_bancaire_id', '=', 'credits_bancaires.id')
                ->join('banques', 'credits_bancaires.banque_id', '=', 'banques.id')
                ->where('echeances_credit.statut', 'En attente')
                ->whereBetween('echeances_credit.date_echeance', [now(), now()->addDays(7)])
                ->select(
                    'echeances_credit.*',
                    'credits_bancaires.numero as credit_numero',
                    'credits_bancaires.objet as credit_objet',
                    'banques.nom as banque_nom'
                )
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

            // Échéances en retard
            $echeancesRetard = DB::table('echeances_credit')
                ->join('credits_bancaires', 'echeances_credit.credit_bancaire_id', '=', 'credits_bancaires.id')
                ->join('banques', 'credits_bancaires.banque_id', '=', 'banques.id')
                ->where('echeances_credit.statut', 'En retard')
                ->select(
                    'echeances_credit.*',
                    'credits_bancaires.numero as credit_numero',
                    'banques.nom as banque_nom'
                )
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

    /**
     * Générer les alertes pour les devis expirant bientôt
     */
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

    /**
     * Générer toutes les alertes système
     */
    public function generateAllAlerts(): array
    {
        $alerts = [];
        
        $alerts = array_merge($alerts, $this->generateFacturesEnRetardAlerts());
        $alerts = array_merge($alerts, $this->generateEcheancesCreditAlerts());
        $alerts = array_merge($alerts, $this->generateDevisExpirantsAlerts());

        // Trier par type (error > warning > info)
        usort($alerts, function ($a, $b) {
            $priority = ['error' => 0, 'warning' => 1, 'info' => 2, 'success' => 3];
            return ($priority[$a['type']] ?? 4) <=> ($priority[$b['type']] ?? 4);
        });

        return $alerts;
    }

    /**
     * Notifier un nouveau paiement
     */
    public function notifyNewPaiement(Paiement $paiement): void
    {
        try {
            $document = $paiement->facture ?? $paiement->ordre;
            if (!$document) return;
            
            $documentType = $paiement->facture_id ? 'facture' : 'ordre';
            $documentNumero = $document->numero ?? 'N/A';
            $clientNom = $document->client->nom ?? $document->client->raison_sociale ?? 'Client';

            $this->createForRole('admin', [
                'type' => 'success',
                'title' => 'Nouveau paiement reçu',
                'message' => "Paiement de " . number_format($paiement->montant, 0, ',', ' ') . " FCFA reçu pour {$documentType} {$documentNumero} ({$clientNom}).",
                'icon' => 'paiement',
                'link' => $paiement->facture_id ? "/factures/{$paiement->facture_id}" : "/ordres/{$paiement->ordre_id}",
                'metadata' => [
                    'paiement_id' => $paiement->id,
                    'montant' => $paiement->montant,
                    'mode_paiement' => $paiement->mode_paiement,
                    'document_type' => $documentType,
                    'document_id' => $paiement->facture_id ?? $paiement->ordre_id,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::warning('Erreur notification paiement: ' . $e->getMessage());
        }
    }

    /**
     * Notifier une nouvelle facture
     */
    public function notifyNewFacture(Facture $facture): void
    {
        try {
            $clientNom = $facture->client->nom ?? $facture->client->raison_sociale ?? 'Client';

            $this->createForRole('admin', [
                'type' => 'info',
                'title' => 'Nouvelle facture créée',
                'message' => "Facture {$facture->numero} créée pour {$clientNom} - " . number_format($facture->montant_ttc, 0, ',', ' ') . " FCFA.",
                'icon' => 'facture',
                'link' => "/factures/{$facture->id}",
                'metadata' => [
                    'facture_id' => $facture->id,
                    'facture_numero' => $facture->numero,
                    'client_id' => $facture->client_id,
                    'montant_ttc' => $facture->montant_ttc,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::warning('Erreur notification facture: ' . $e->getMessage());
        }
    }

    /**
     * Notifier un nouveau client
     */
    public function notifyNewClient(Client $client): void
    {
        try {
            $clientNom = $client->nom ?? $client->raison_sociale ?? 'Nouveau client';

            $this->createForRole('admin', [
                'type' => 'info',
                'title' => 'Nouveau client enregistré',
                'message' => "Le client {$clientNom} a été ajouté à la base de données.",
                'icon' => 'client',
                'link' => "/clients/{$client->id}",
                'metadata' => [
                    'client_id' => $client->id,
                    'client_nom' => $clientNom,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::warning('Erreur notification client: ' . $e->getMessage());
        }
    }

    /**
     * Statistiques des notifications
     */
    public function getStats(int $userId): array
    {
        $baseQuery = Notification::where('user_id', $userId)
            ->where('created_at', '>=', now()->subDays(30));

        return [
            'total' => $baseQuery->count(),
            'unread' => $baseQuery->clone()->where('read', false)->count(),
            'by_type' => [
                'info' => $baseQuery->clone()->where('type', 'info')->count(),
                'warning' => $baseQuery->clone()->where('type', 'warning')->count(),
                'success' => $baseQuery->clone()->where('type', 'success')->count(),
                'error' => $baseQuery->clone()->where('type', 'error')->count(),
            ],
        ];
    }
}
