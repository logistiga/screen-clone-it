<?php

namespace App\Listeners;

use App\Events\OrdreCreated;
use App\Models\Notification;
use App\Services\EmailAutomationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendOrdreCreatedNotification implements ShouldQueue
{
    public function handle(OrdreCreated $event): void
    {
        $ordre = $event->ordre;
        $ordre->load('client');

        try {
            Notification::create([
                'type' => 'ordre',
                'titre' => 'Nouvel ordre de travail',
                'message' => "L'ordre {$ordre->numero} a été créé" . ($ordre->client ? " pour {$ordre->client->nom}" : ''),
                'data' => [
                    'ordre_id' => $ordre->id,
                    'numero' => $ordre->numero,
                    'client_id' => $ordre->client_id,
                ],
                'action_url' => "/ordres/{$ordre->id}",
                'priorite' => 'normale',
            ]);

            Log::info("Notification créée pour ordre {$ordre->numero}");

            app(EmailAutomationService::class)->trigger('creation_ordre', $ordre);
        } catch (\Exception $e) {
            Log::error("Erreur création notification ordre: " . $e->getMessage());
        }
    }
}
