<?php

namespace App\Console\Commands;

use App\Models\Armateur;
use App\Models\ConteneurTraite;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Synchronisation unidirectionnelle: OPS → FAC
 * 
 * Cette commande lit la base OPS pour:
 * 1. Importer les conteneurs traités en attente de facturation
 * 2. Synchroniser les armateurs
 * 
 * Usage:
 *   php artisan sync:from-ops                    # Sync complet
 *   php artisan sync:from-ops --conteneurs      # Conteneurs uniquement
 *   php artisan sync:from-ops --armateurs       # Armateurs uniquement
 *   php artisan sync:from-ops --dry-run         # Afficher sans modifier
 *   php artisan sync:from-ops --status          # Tester la connexion
 */
class SyncFromOps extends Command
{
    protected $signature = 'sync:from-ops 
                            {--conteneurs : Synchroniser uniquement les conteneurs}
                            {--armateurs : Synchroniser uniquement les armateurs}
                            {--dry-run : Afficher les données sans les insérer}
                            {--status : Tester la connexion OPS}';

    protected $description = 'Synchronise les conteneurs et armateurs depuis Logistiga OPS';

    private int $conteneursImported = 0;
    private int $conteneursSkipped = 0;
    private int $armateursImported = 0;
    private int $armateursUpdated = 0;

    public function handle(): int
    {
        // Test de connexion uniquement
        if ($this->option('status')) {
            return $this->testConnection();
        }

        $this->info('🔄 Synchronisation OPS → FAC');
        $this->newLine();

        // Vérifier la connexion
        if (!$this->checkOpsConnection()) {
            return Command::FAILURE;
        }

        $syncAll = !$this->option('conteneurs') && !$this->option('armateurs');

        try {
            DB::beginTransaction();

            // Sync armateurs d'abord (pour les références)
            if ($syncAll || $this->option('armateurs')) {
                $this->syncArmateurs();
            }

            // Sync conteneurs
            if ($syncAll || $this->option('conteneurs')) {
                $this->syncConteneurs();
            }

            if (!$this->option('dry-run')) {
                DB::commit();
            }

            $this->displaySummary();

            Log::info('[SyncFromOps] Synchronisation terminée', [
                'conteneurs_imported' => $this->conteneursImported,
                'conteneurs_skipped' => $this->conteneursSkipped,
                'armateurs_imported' => $this->armateursImported,
                'armateurs_updated' => $this->armateursUpdated,
            ]);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("❌ Erreur: {$e->getMessage()}");
            Log::error('[SyncFromOps] Échec synchronisation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Command::FAILURE;
        }
    }

    private function testConnection(): int
    {
        $this->info('🔌 Test de connexion à la base OPS...');

        try {
            $result = DB::connection('ops')->select('SELECT 1 as test');
            
            if (!empty($result)) {
                $this->info('✅ Connexion OPS réussie');
                
                // Compter les tables disponibles
                $tables = DB::connection('ops')->select('SHOW TABLES');
                $this->line("   Tables disponibles: " . count($tables));
                
                return Command::SUCCESS;
            }
        } catch (\Exception $e) {
            $this->error("❌ Connexion OPS échouée: {$e->getMessage()}");
            $this->newLine();
            $this->warn('Vérifiez les variables d\'environnement OPS_DB_* dans .env');
        }

        return Command::FAILURE;
    }

    private function checkOpsConnection(): bool
    {
        try {
            DB::connection('ops')->getPdo();
            return true;
        } catch (\Exception $e) {
            $this->error("❌ Impossible de se connecter à la base OPS");
            $this->line("   Erreur: {$e->getMessage()}");
            $this->newLine();
            $this->warn('Configurez les variables OPS_DB_* dans .env');
            return false;
        }
    }

    /**
     * Synchronise les armateurs depuis OPS
     */
    private function syncArmateurs(): void
    {
        $this->info('📦 Synchronisation des armateurs...');

        // Lire les armateurs depuis OPS
        // Note: Adapter le nom de table selon la structure OPS
        $opsArmateurs = DB::connection('ops')
            ->table('armateurs')
            ->select(['id', 'nom', 'code', 'email', 'telephone', 'adresse', 'actif', 'created_at', 'updated_at'])
            ->get();

        $bar = $this->output->createProgressBar($opsArmateurs->count());
        $bar->start();

        foreach ($opsArmateurs as $opsArmateur) {
            if ($this->option('dry-run')) {
                $this->line("   [DRY-RUN] Armateur: {$opsArmateur->nom} ({$opsArmateur->code})");
                $bar->advance();
                continue;
            }

            // Upsert basé sur le code (identifiant métier unique)
            $existing = Armateur::where('code', $opsArmateur->code)->first();

            if ($existing) {
                // Mettre à jour si modifié récemment dans OPS
                if ($opsArmateur->updated_at > $existing->updated_at) {
                    $existing->update([
                        'nom' => $opsArmateur->nom,
                        'email' => $opsArmateur->email,
                        'telephone' => $opsArmateur->telephone,
                        'adresse' => $opsArmateur->adresse,
                        'actif' => $opsArmateur->actif ?? true,
                    ]);
                    $this->armateursUpdated++;
                }
            } else {
                // Créer le nouvel armateur
                Armateur::create([
                    'nom' => $opsArmateur->nom,
                    'code' => $opsArmateur->code,
                    'email' => $opsArmateur->email,
                    'telephone' => $opsArmateur->telephone,
                    'adresse' => $opsArmateur->adresse,
                    'actif' => $opsArmateur->actif ?? true,
                ]);
                $this->armateursImported++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Synchronise les conteneurs traités depuis OPS
     */
    private function syncConteneurs(): void
    {
        $this->info('🚢 Synchronisation des conteneurs traités...');

        // Lire les sorties/conteneurs depuis OPS qui sont terminées
        // Note: Adapter la requête selon la structure réelle de la table OPS
        $opsConteneurs = DB::connection('ops')
            ->table('sorties') // ou 'conteneurs_sorties' selon votre schéma
            ->select([
                'id as sortie_id_externe',
                'numero_conteneur',
                'numero_bl',
                'armateur_code',
                'armateur_nom',
                'client_nom',
                'client_adresse',
                'transitaire_nom',
                'date_sortie',
                'date_retour',
                'camion_id as camion_id_externe',
                'camion_plaque',
                'remorque_id as remorque_id_externe', 
                'remorque_plaque',
                'chauffeur_nom',
                'prime_chauffeur',
                'destination_type',
                'destination_adresse',
                'statut as statut_ops',
                'created_at',
                'updated_at',
            ])
            ->where('statut', 'termine') // Conteneurs dont l'opération est terminée
            ->orWhere('statut', 'retourne') // Ou retournés
            ->get();

        $bar = $this->output->createProgressBar($opsConteneurs->count());
        $bar->start();

        foreach ($opsConteneurs as $opsConteneur) {
            // Vérifier si déjà synchronisé
            $existeDejaSync = ConteneurTraite::where('sortie_id_externe', $opsConteneur->sortie_id_externe)->exists();

            if ($existeDejaSync) {
                $this->conteneursSkipped++;
                $bar->advance();
                continue;
            }

            if ($this->option('dry-run')) {
                $this->line("   [DRY-RUN] Conteneur: {$opsConteneur->numero_conteneur} - BL: {$opsConteneur->numero_bl}");
                $bar->advance();
                continue;
            }

            // Insérer dans conteneurs_traites
            ConteneurTraite::create([
                'sortie_id_externe' => $opsConteneur->sortie_id_externe,
                'numero_conteneur' => $opsConteneur->numero_conteneur,
                'numero_bl' => $opsConteneur->numero_bl,
                'armateur_code' => $opsConteneur->armateur_code,
                'armateur_nom' => $opsConteneur->armateur_nom,
                'client_nom' => $opsConteneur->client_nom,
                'client_adresse' => $opsConteneur->client_adresse,
                'transitaire_nom' => $opsConteneur->transitaire_nom,
                'date_sortie' => $opsConteneur->date_sortie,
                'date_retour' => $opsConteneur->date_retour,
                'camion_id_externe' => $opsConteneur->camion_id_externe,
                'camion_plaque' => $opsConteneur->camion_plaque,
                'remorque_id_externe' => $opsConteneur->remorque_id_externe,
                'remorque_plaque' => $opsConteneur->remorque_plaque,
                'chauffeur_nom' => $opsConteneur->chauffeur_nom,
                'prime_chauffeur' => $opsConteneur->prime_chauffeur,
                'destination_type' => $opsConteneur->destination_type,
                'destination_adresse' => $opsConteneur->destination_adresse,
                'statut_ops' => $opsConteneur->statut_ops,
                'statut' => 'en_attente', // Nouveau conteneur = en attente de facturation
                'source_system' => 'logistiga_ops',
                'synced_at' => now(),
            ]);

            $this->conteneursImported++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    private function displaySummary(): void
    {
        $this->newLine();
        $this->info('📊 Résumé de la synchronisation:');
        $this->table(
            ['Élément', 'Importés', 'Mis à jour', 'Ignorés'],
            [
                ['Armateurs', $this->armateursImported, $this->armateursUpdated, '-'],
                ['Conteneurs', $this->conteneursImported, '-', $this->conteneursSkipped],
            ]
        );

        if ($this->option('dry-run')) {
            $this->warn('⚠️  Mode dry-run: aucune donnée n\'a été modifiée');
        }
    }
}
