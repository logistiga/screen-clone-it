<?php

namespace App\Listeners;

use App\Events\FactureUpdated;
use App\Models\Notification;
use App\Services\CacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class HandleFactureStatusChange implements ShouldQueue
{
    public function handle(FactureUpdated $event): void
    {
        if (!$event->wasStatusChanged()) {
            // Juste invalider le cache si pas de changement de statut
            CacheService::invalidateDashboard();
            return;
        }

        $facture = $event->facture;
        $facture->load('client');
        $newStatus = $facture->statut;

        try {
            $message = match ($newStatus) {
                'Payée', 'payee' => "La facture {$facture->numero} a été payée intégralement",
                'Annulée', 'annulee' => "La facture {$facture->numero} a été annulée",
                'Envoyée', 'envoye' => "La facture {$facture->numero} a été envoyée au client",
                default => "La facture {$facture->numero} a changé de statut: {$newStatus}",
            };

            $priorite = match ($newStatus) {
                'Payée', 'payee' => 'normale',
                'Annulée', 'annulee' => 'haute',
                default => 'basse',
            };

            Notification::create([
                'type' => 'facture',
                'titre' => 'Changement de statut facture',
                'message' => $message,
                'data' => [
                    'facture_id' => $facture->id,
                    'numero' => $facture->numero,
                    'old_status' => $event->getOldStatus(),
                    'new_status' => $newStatus,
                ],
                'action_url' => "/factures/{$facture->id}",
                'priorite' => $priorite,
            ]);

            CacheService::invalidateDashboard();

            Log::info("Notification changement statut facture {$facture->numero}: {$newStatus}");
        } catch (\Exception $e) {
            Log::error("Erreur notification changement statut: " . $e->getMessage());
        }
    }
}
