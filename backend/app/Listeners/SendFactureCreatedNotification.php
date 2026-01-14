<?php

namespace App\Listeners;

use App\Events\FactureCreated;
use App\Models\Notification;
use App\Services\CacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendFactureCreatedNotification implements ShouldQueue
{
    public function handle(FactureCreated $event): void
    {
        $facture = $event->facture;
        $facture->load('client');

        try {
            // Créer une notification en base de données
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

            // Invalider le cache dashboard
            CacheService::invalidateDashboard();

            Log::info("Notification créée pour facture {$facture->numero}");
        } catch (\Exception $e) {
            Log::error("Erreur création notification facture: " . $e->getMessage());
        }
    }
}
