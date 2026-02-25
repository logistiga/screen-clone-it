<?php

namespace App\Listeners;

use App\Events\FactureDeleted;
use App\Models\Notification;
use App\Services\EmailAutomationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendFactureDeletedNotification implements ShouldQueue
{
    public function handle(FactureDeleted $event): void
    {
        $facture = $event->facture;

        try {
            Notification::create([
                'type' => 'facture',
                'titre' => 'Facture supprimée',
                'message' => "La facture {$facture->numero} a été supprimée" . ($facture->client ? " (Client: {$facture->client->nom})" : ''),
                'data' => [
                    'facture_id' => $facture->id,
                    'numero' => $facture->numero,
                    'client_id' => $facture->client_id,
                ],
                'action_url' => "/factures",
                'priorite' => 'haute',
            ]);

            Log::info("Notification créée pour suppression facture {$facture->numero}");

            app(EmailAutomationService::class)->trigger('suppression_facture', $facture);
        } catch (\Exception $e) {
            Log::error("Erreur création notification suppression facture: " . $e->getMessage());
        }
    }
}
