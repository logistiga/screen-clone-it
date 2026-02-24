<?php

namespace App\Listeners;

use App\Events\DevisDeleted;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendDevisDeletedNotification implements ShouldQueue
{
    public function handle(DevisDeleted $event): void
    {
        $devis = $event->devis;

        try {
            Notification::create([
                'type' => 'devis',
                'titre' => 'Devis supprimé',
                'message' => "Le devis {$devis->numero} a été supprimé" . ($devis->client ? " (Client: {$devis->client->nom})" : ''),
                'data' => [
                    'devis_id' => $devis->id,
                    'numero' => $devis->numero,
                    'client_id' => $devis->client_id,
                ],
                'action_url' => "/devis",
                'priorite' => 'haute',
            ]);

            Log::info("Notification créée pour suppression devis {$devis->numero}");
        } catch (\Exception $e) {
            Log::error("Erreur création notification suppression devis: " . $e->getMessage());
        }
    }
}
