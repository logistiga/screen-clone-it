<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Facture;
use App\Models\Devis;
use App\Models\Client;
use App\Models\Paiement;
use App\Services\Alert\AlertGeneratorService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Façade AlertNotificationService — alertes déléguées à AlertGeneratorService
 */
class AlertNotificationService
{
    protected AlertGeneratorService $alertGenerator;

    public function __construct()
    {
        $this->alertGenerator = new AlertGeneratorService();
    }

    // === CRUD Notifications ===
    public function create(int $userId, array $data): Notification
    {
        return Notification::create([
            'user_id' => $userId, 'type' => $data['type'] ?? 'info',
            'title' => $data['title'], 'message' => $data['message'],
            'icon' => $data['icon'] ?? null, 'link' => $data['link'] ?? null,
            'metadata' => $data['metadata'] ?? null, 'read' => false,
        ]);
    }

    public function createForAll(array $data): void
    {
        foreach (User::where('actif', true)->get() as $user) { $this->create($user->id, $data); }
    }

    public function createForRole(string $role, array $data): void
    {
        $users = User::whereHas('roles', fn($q) => $q->where('name', $role))->where('actif', true)->get();
        foreach ($users as $user) { $this->create($user->id, $data); }
    }

    public function getForUser(int $userId, array $params = []): array
    {
        $query = Notification::where('user_id', $userId)->where('created_at', '>=', now()->subDays(30))->orderBy('created_at', 'desc');
        if (!empty($params['unread_only'])) $query->where('read', false);
        if (!empty($params['type'])) $query->where('type', $params['type']);

        $notifications = $query->paginate($params['per_page'] ?? 50);
        $unreadCount = Notification::where('user_id', $userId)->where('read', false)->count();

        return [
            'data' => $notifications->items(), 'unread_count' => $unreadCount, 'total' => $notifications->total(),
            'meta' => ['current_page' => $notifications->currentPage(), 'last_page' => $notifications->lastPage(), 'per_page' => $notifications->perPage(), 'total' => $notifications->total()],
        ];
    }

    public function markAsRead(int $notificationId): void { Notification::where('id', $notificationId)->update(['read' => true]); }
    public function markAllAsRead(int $userId): void { Notification::where('user_id', $userId)->where('read', false)->update(['read' => true]); }
    public function delete(int $notificationId): void { Notification::where('id', $notificationId)->delete(); }
    public function deleteAll(int $userId): void { Notification::where('user_id', $userId)->delete(); }

    // === Alertes (déléguées) ===
    public function generateFacturesEnRetardAlerts(): array { return $this->alertGenerator->generateFacturesEnRetardAlerts(); }
    public function generateEcheancesCreditAlerts(): array { return $this->alertGenerator->generateEcheancesCreditAlerts(); }
    public function generateDevisExpirantsAlerts(): array { return $this->alertGenerator->generateDevisExpirantsAlerts(); }
    public function generateAllAlerts(): array { return $this->alertGenerator->generateAllAlerts(); }

    // === Notifications métier ===
    public function notifyNewPaiement(Paiement $paiement): void
    {
        try {
            $document = $paiement->facture ?? $paiement->ordre;
            if (!$document) return;
            $documentType = $paiement->facture_id ? 'facture' : 'ordre';
            $clientNom = $document->client->nom ?? $document->client->raison_sociale ?? 'Client';

            $this->createForRole('admin', [
                'type' => 'success', 'title' => 'Nouveau paiement reçu',
                'message' => "Paiement de " . number_format($paiement->montant, 0, ',', ' ') . " FCFA reçu pour {$documentType} {$document->numero} ({$clientNom}).",
                'icon' => 'paiement',
                'link' => $paiement->facture_id ? "/factures/{$paiement->facture_id}" : "/ordres/{$paiement->ordre_id}",
                'metadata' => ['paiement_id' => $paiement->id, 'montant' => $paiement->montant, 'mode_paiement' => $paiement->mode_paiement],
            ]);
        } catch (\Exception $e) { \Log::warning('Erreur notification paiement: ' . $e->getMessage()); }
    }

    public function notifyNewFacture(Facture $facture): void
    {
        try {
            $clientNom = $facture->client->nom ?? $facture->client->raison_sociale ?? 'Client';
            $this->createForRole('admin', [
                'type' => 'info', 'title' => 'Nouvelle facture créée',
                'message' => "Facture {$facture->numero} créée pour {$clientNom} - " . number_format($facture->montant_ttc, 0, ',', ' ') . " FCFA.",
                'icon' => 'facture', 'link' => "/factures/{$facture->id}",
                'metadata' => ['facture_id' => $facture->id, 'montant_ttc' => $facture->montant_ttc],
            ]);
        } catch (\Exception $e) { \Log::warning('Erreur notification facture: ' . $e->getMessage()); }
    }

    public function notifyNewClient(Client $client): void
    {
        try {
            $clientNom = $client->nom ?? $client->raison_sociale ?? 'Nouveau client';
            $this->createForRole('admin', [
                'type' => 'info', 'title' => 'Nouveau client enregistré',
                'message' => "Le client {$clientNom} a été ajouté à la base de données.",
                'icon' => 'client', 'link' => "/clients/{$client->id}",
                'metadata' => ['client_id' => $client->id, 'client_nom' => $clientNom],
            ]);
        } catch (\Exception $e) { \Log::warning('Erreur notification client: ' . $e->getMessage()); }
    }

    public function getStats(int $userId): array
    {
        $baseQuery = Notification::where('user_id', $userId)->where('created_at', '>=', now()->subDays(30));
        return [
            'total' => $baseQuery->count(), 'unread' => $baseQuery->clone()->where('read', false)->count(),
            'by_type' => [
                'info' => $baseQuery->clone()->where('type', 'info')->count(),
                'warning' => $baseQuery->clone()->where('type', 'warning')->count(),
                'success' => $baseQuery->clone()->where('type', 'success')->count(),
                'error' => $baseQuery->clone()->where('type', 'error')->count(),
            ],
        ];
    }
}
