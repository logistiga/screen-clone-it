<?php

namespace App\Listeners;

use App\Events\DevisUpdated;
use App\Models\Notification;
use App\Services\EmailAutomationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendDevisUpdatedNotification implements ShouldQueue
{
    public function handle(DevisUpdated $event): void
    {
        $devis = $event->devis;
        $devis->load('client');

        try {
            Notification::create([
                'type' => 'devis',
                'titre' => 'Devis modifié',
                'message' => "Le devis {$devis->numero} a été modifié" . ($devis->client ? " (Client: {$devis->client->nom})" : ''),
                'data' => [
                    'devis_id' => $devis->id,
                    'numero' => $devis->numero,
                    'client_id' => $devis->client_id,
                    'modifications' => array_keys($event->changedAttributes),
                ],
                'action_url' => "/devis/{$devis->id}",
                'priorite' => 'normale',
            ]);

            Log::info("Notification créée pour modification devis {$devis->numero}");

            app(EmailAutomationService::class)->trigger('modification_devis', $devis);
        } catch (\Exception $e) {
            Log::error("Erreur création notification modification devis: " . $e->getMessage());
        }
    }
}
