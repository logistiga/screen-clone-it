<?php

namespace App\Listeners;

use App\Events\FactureCreated;
use App\Models\Notification;
use App\Services\CacheService;
use App\Services\EmailAutomationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendFactureCreatedNotification implements ShouldQueue
{
    public function handle(FactureCreated $event): void
    {
        $facture = $event->facture;
        $facture->load('client');

        try {
            Notification::create([
                'type' => 'facture',
                'titre' => 'Nouvelle facture créée',
                'message' => "La facture {$facture->numero} a été créée pour {$facture->client?->nom}",
                'data' => [
                    'facture_id' => $facture->id,
                    'numero' => $facture->numero,
                    'client_id' => $facture->client_id,
                    'montant_ttc' => $facture->montant_ttc,
                ],
                'action_url' => "/factures/{$facture->id}",
                'priorite' => 'normale',
            ]);

            CacheService::invalidateDashboard();

            Log::info("Notification créée pour facture {$facture->numero}");

            app(EmailAutomationService::class)->trigger('creation_facture', $facture);
        } catch (\Exception $e) {
            Log::error("Erreur création notification facture: " . $e->getMessage());
        }
    }
}
