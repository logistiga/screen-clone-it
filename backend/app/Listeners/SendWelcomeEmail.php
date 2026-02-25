<?php

namespace App\Listeners;

use App\Events\ClientCreated;
use App\Models\Notification;
use App\Services\EmailAutomationService;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendWelcomeEmail implements ShouldQueue
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function handle(ClientCreated $event): void
    {
        $client = $event->client;

        try {
            Notification::create([
                'type' => 'client',
                'titre' => 'Nouveau client',
                'message' => "Le client {$client->nom} a été créé",
                'data' => [
                    'client_id' => $client->id,
                    'nom' => $client->nom,
                    'email' => $client->email,
                    'type' => $client->type,
                ],
                'action_url' => "/clients/{$client->id}",
                'priorite' => 'basse',
            ]);

            if ($client->email) {
                $this->notificationService->notifierNouveauClient($client);
            }

            Log::info("Notification nouveau client: {$client->nom}");

            app(EmailAutomationService::class)->trigger('nouveau_client', $client);
        } catch (\Exception $e) {
            Log::error("Erreur notification nouveau client: " . $e->getMessage());
        }
    }
}
