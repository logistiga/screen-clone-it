<?php

namespace App\Listeners;

use App\Events\CreditEcheanceApproaching;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class SendCreditAlertNotification implements ShouldQueue
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function handle(CreditEcheanceApproaching $event): void
    {
        $credit = $event->credit;
        $joursRestants = $event->joursRestants;

        try {
            $priorite = match (true) {
                $joursRestants <= 3 => 'haute',
                $joursRestants <= 7 => 'moyenne',
                default => 'normale',
            };

            Notification::create([
                'type' => 'alerte',
                'titre' => 'Échéance crédit proche',
                'message' => "Le crédit {$credit->reference} arrive à échéance dans {$joursRestants} jours",
                'data' => [
                    'credit_id' => $credit->id,
                    'reference' => $credit->reference,
                    'jours_restants' => $joursRestants,
                    'montant_restant' => $credit->montant_restant,
                ],
                'action_url' => "/credits/{$credit->id}",
                'priorite' => $priorite,
            ]);

            // Envoyer email aux admins
            $this->notificationService->envoyerAlerteEcheanceCredit($credit, $joursRestants);

            Log::info("Alerte échéance crédit {$credit->reference}: {$joursRestants} jours");
        } catch (\Exception $e) {
            Log::error("Erreur alerte crédit: " . $e->getMessage());
        }
    }
}
