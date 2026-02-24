<?php

namespace App\Listeners;

use App\Events\OrdreUpdated;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendOrdreUpdatedNotification implements ShouldQueue
{
    public function handle(OrdreUpdated $event): void
    {
        $ordre = $event->ordre;
        $ordre->load('client');

        try {
            Notification::create([
                'type' => 'ordre',
                'titre' => 'Ordre de travail modifié',
                'message' => "L'ordre {$ordre->numero} a été modifié" . ($ordre->client ? " (Client: {$ordre->client->nom})" : ''),
                'data' => [
                    'ordre_id' => $ordre->id,
                    'numero' => $ordre->numero,
                    'client_id' => $ordre->client_id,
                    'modifications' => array_keys($event->changedAttributes),
                ],
                'action_url' => "/ordres/{$ordre->id}",
                'priorite' => 'normale',
            ]);

            Log::info("Notification créée pour modification ordre {$ordre->numero}");
        } catch (\Exception $e) {
            Log::error("Erreur création notification modification ordre: " . $e->getMessage());
        }
    }
}
