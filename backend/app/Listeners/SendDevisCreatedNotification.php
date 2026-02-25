<?php

namespace App\Listeners;

use App\Events\DevisCreated;
use App\Models\Notification;
use App\Services\EmailAutomationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendDevisCreatedNotification implements ShouldQueue
{
    public function handle(DevisCreated $event): void
    {
        $devis = $event->devis;
        $devis->load('client');

        try {
            Notification::create([
                'type' => 'devis',
                'titre' => 'Nouveau devis créé',
                'message' => "Le devis {$devis->numero} a été créé pour {$devis->client?->nom}",
                'data' => [
                    'devis_id' => $devis->id,
                    'numero' => $devis->numero,
                    'client_id' => $devis->client_id,
                    'montant_ttc' => $devis->montant_ttc,
                ],
                'action_url' => "/devis/{$devis->id}",
                'priorite' => 'basse',
            ]);

            Log::info("Notification créée pour devis {$devis->numero}");

            app(EmailAutomationService::class)->trigger('creation_devis', $devis);
        } catch (\Exception $e) {
            Log::error("Erreur création notification devis: " . $e->getMessage());
        }
    }
}
