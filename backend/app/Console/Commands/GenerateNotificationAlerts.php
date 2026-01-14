<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use App\Models\User;
use Illuminate\Console\Command;

class GenerateNotificationAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:generate-alerts 
                            {--user= : ID utilisateur spécifique (optionnel)}
                            {--dry-run : Afficher sans créer}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Génère les notifications automatiques pour les alertes système (factures en retard, échéances crédit, etc.)';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService): int
    {
        $this->info('🔔 Génération des alertes de notification...');

        $alerts = $notificationService->generateAllAlerts();

        if (empty($alerts)) {
            $this->info('✅ Aucune alerte à générer.');
            return Command::SUCCESS;
        }

        $this->info("📊 {$this->countAlerts($alerts)} alertes trouvées:");
        $this->table(
            ['Type', 'Titre', 'Message'],
            array_map(fn($a) => [$a['type'], $a['title'], substr($a['message'], 0, 50) . '...'], $alerts)
        );

        if ($this->option('dry-run')) {
            $this->warn('🔍 Mode dry-run - aucune notification créée.');
            return Command::SUCCESS;
        }

        // Déterminer les utilisateurs cibles
        $userId = $this->option('user');
        
        if ($userId) {
            $users = User::where('id', $userId)->get();
        } else {
            // Envoyer aux admins et gestionnaires
            $users = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'super-admin', 'gestionnaire']);
            })->where('actif', true)->get();
        }

        if ($users->isEmpty()) {
            $this->warn('⚠️ Aucun utilisateur cible trouvé.');
            return Command::SUCCESS;
        }

        $this->info("👥 Envoi aux {$users->count()} utilisateur(s)...");

        $created = 0;
        foreach ($users as $user) {
            foreach ($alerts as $alert) {
                // Vérifier si une notification similaire n'existe pas déjà (dans les 24h)
                $exists = \App\Models\Notification::where('user_id', $user->id)
                    ->where('title', $alert['title'])
                    ->where('created_at', '>=', now()->subHours(24))
                    ->exists();

                if (!$exists) {
                    $notificationService->create($user->id, $alert);
                    $created++;
                }
            }
        }

        $this->info("✅ {$created} notification(s) créée(s).");

        return Command::SUCCESS;
    }

    private function countAlerts(array $alerts): int
    {
        return count($alerts);
    }
}
