<?php

namespace App\Listeners;

use App\Events\DevisConverted;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendDevisConvertedNotification implements ShouldQueue
{
    public function handle(DevisConverted $event): void
    {
        $devis = $event->devis;
        $ordre = $event->ordre;
        $devis->load('client');

        try {
            Notification::create([
                'type' => 'devis',
                'titre' => 'Devis converti en ordre',
                'message' => "Le devis {$devis->numero} a été converti en ordre de travail {$ordre->numero}",
                'data' => [
                    'devis_id' => $devis->id,
                    'devis_numero' => $devis->numero,
                    'ordre_id' => $ordre->id,
                    'ordre_numero' => $ordre->numero,
                    'client_id' => $devis->client_id,
                ],
                'action_url' => "/ordres/{$ordre->id}",
                'priorite' => 'normale',
            ]);

            Log::info("Notification conversion devis {$devis->numero} -> ordre {$ordre->numero}");
        } catch (\Exception $e) {
            Log::error("Erreur notification conversion devis: " . $e->getMessage());
        }
    }
}
