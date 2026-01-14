<?php

namespace App\Listeners;

use App\Events\ClientCreated;
use App\Models\Notification;
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
            // Créer notification interne
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

            // Envoyer email de bienvenue si email présent
            if ($client->email) {
                $this->notificationService->notifierNouveauClient($client);
            }

            Log::info("Notification nouveau client: {$client->nom}");
        } catch (\Exception $e) {
            Log::error("Erreur notification nouveau client: " . $e->getMessage());
        }
    }
}
