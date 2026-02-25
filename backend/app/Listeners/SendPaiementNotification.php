<?php

namespace App\Listeners;

use App\Events\PaiementCreated;
use App\Models\Notification;
use App\Services\CacheService;
use App\Services\EmailAutomationService;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendPaiementNotification implements ShouldQueue
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function handle(PaiementCreated $event): void
    {
        $paiement = $event->paiement;
        $paiement->load(['facture.client', 'ordre.client']);

        $client = $paiement->facture?->client ?? $paiement->ordre?->client;

        try {
            Notification::create([
                'type' => 'paiement',
                'titre' => 'Nouveau paiement reçu',
                'message' => sprintf(
                    "Paiement de %s FCFA reçu de %s",
                    number_format($paiement->montant, 0, ',', ' '),
                    $client?->nom ?? 'Client inconnu'
                ),
                'data' => [
                    'paiement_id' => $paiement->id,
                    'montant' => $paiement->montant,
                    'mode_paiement' => $paiement->mode_paiement,
                    'facture_id' => $paiement->facture_id,
                    'ordre_id' => $paiement->ordre_id,
                    'client_id' => $client?->id,
                ],
                'action_url' => $paiement->facture_id 
                    ? "/factures/{$paiement->facture_id}" 
                    : "/ordres/{$paiement->ordre_id}",
                'priorite' => 'normale',
            ]);

            CacheService::invalidateDashboard();

            Log::info("Notification paiement créée: {$paiement->montant} FCFA");

            app(EmailAutomationService::class)->trigger('paiement_recu', $paiement);
        } catch (\Exception $e) {
            Log::error("Erreur création notification paiement: " . $e->getMessage());
        }
    }
}
