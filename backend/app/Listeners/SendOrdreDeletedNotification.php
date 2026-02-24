<?php

namespace App\Listeners;

use App\Events\OrdreDeleted;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendOrdreDeletedNotification implements ShouldQueue
{
    public function handle(OrdreDeleted $event): void
    {
        $ordre = $event->ordre;

        try {
            Notification::create([
                'type' => 'ordre',
                'titre' => 'Ordre de travail supprimé',
                'message' => "L'ordre {$ordre->numero} a été supprimé" . ($ordre->client ? " (Client: {$ordre->client->nom})" : ''),
                'data' => [
                    'ordre_id' => $ordre->id,
                    'numero' => $ordre->numero,
                    'client_id' => $ordre->client_id,
                ],
                'action_url' => "/ordres",
                'priorite' => 'haute',
            ]);

            Log::info("Notification créée pour suppression ordre {$ordre->numero}");
        } catch (\Exception $e) {
            Log::error("Erreur création notification suppression ordre: " . $e->getMessage());
        }
    }
}
