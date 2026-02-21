<?php

namespace App\Console\Commands;

use App\Models\Armateur;
use App\Models\ConteneurAnomalie;
use App\Models\ConteneurTraite;
use App\Models\OrdreTravail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Synchronisation unidirectionnelle: OPS → FAC
 * 
 * Cette commande lit la base OPS pour:
 * 1. Importer les conteneurs traités en attente de facturation
 * 2. Synchroniser les armateurs
 * 3. Détecter les anomalies (conteneurs oubliés)
 * 
 * Usage:
 *   php artisan sync:from-ops                    # Sync complet
 *   php artisan sync:from-ops --conteneurs      # Conteneurs uniquement
 *   php artisan sync:from-ops --armateurs       # Armateurs uniquement
 *   php artisan sync:from-ops --detect-oublies  # Détection anomalies uniquement
 *   php artisan sync:from-ops --dry-run         # Afficher sans modifier
 *   php artisan sync:from-ops --status          # Tester la connexion
 */
class SyncFromOps extends Command
{
    protected $signature = 'sync:from-ops 
                            {--conteneurs : Synchroniser uniquement les conteneurs}
                            {--armateurs : Synchroniser uniquement les armateurs}
                            {--detect-oublies : Détecter les conteneurs oubliés}
                            {--dry-run : Afficher les données sans les insérer}
                            {--status : Tester la connexion OPS}';

    protected $description = 'Synchronise les conteneurs et armateurs depuis Logistiga OPS et détecte les anomalies';

    private int $conteneursImported = 0;
    private int $conteneursSkipped = 0;
    private int $armateursImported = 0;
    private int $armateursUpdated = 0;
    private int $anomaliesDetected = 0;

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

        $syncAll = !$this->option('conteneurs') && !$this->option('armateurs') && !$this->option('detect-oublies');

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

            // Détection des anomalies
            if ($syncAll || $this->option('detect-oublies')) {
                $this->detecterAnomalies();
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
                'anomalies_detected' => $this->anomaliesDetected,
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
                
                // Compter les conteneurs dans OPS
                $count = DB::connection('ops')->table('sorties_conteneurs')->count();
                $this->line("   Conteneurs dans OPS: " . $count);
                
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

        $opsArmateurs = DB::connection('ops')
            ->table('armateurs')
            ->select(['id', 'nom', 'code', 'type_conteneur', 'actif', 'created_at', 'updated_at'])
            ->get();

        $bar = $this->output->createProgressBar($opsArmateurs->count());
        $bar->start();

        foreach ($opsArmateurs as $opsArmateur) {
            if ($this->option('dry-run')) {
                $this->line("   [DRY-RUN] Armateur: {$opsArmateur->nom} ({$opsArmateur->code})");
                $bar->advance();
                continue;
            }

            $existing = Armateur::where('code', $opsArmateur->code)->first();

            if ($existing) {
                if ($opsArmateur->updated_at > $existing->updated_at) {
                    $existing->update([
                        'nom' => $opsArmateur->nom,
                        'type_conteneur' => $opsArmateur->type_conteneur,
                        'actif' => $opsArmateur->actif ?? true,
                    ]);
                    $this->armateursUpdated++;
                }
            } else {
                Armateur::create([
                    'nom' => $opsArmateur->nom,
                    'code' => $opsArmateur->code,
                    'type_conteneur' => $opsArmateur->type_conteneur,
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
     * Utilise la table `sorties_conteneurs` avec son schéma réel
     */
    private function syncConteneurs(): void
    {
        $this->info('🚢 Synchronisation des conteneurs traités...');

        // Lecture depuis sortie_conteneurs (base logiwkuh_tc)
        // Jointures pour résoudre les FK client_id, armateur_id, transitaire_id
        $opsConteneurs = DB::connection('ops')
            ->table('sortie_conteneurs as sc')
            ->leftJoin('clients as c', 'sc.client_id', '=', 'c.id')
            ->leftJoin('armateurs as a', 'sc.armateur_id', '=', 'a.id')
            ->leftJoin('transitaires as t', 'sc.transitaire_id', '=', 't.id')
            ->select([
                'sc.id as sortie_id_externe',
                'sc.numero_conteneur',
                'sc.numero_bl',
                'sc.type_conteneur',
                'c.nom as nom_client',
                'a.code as code_armateur',
                'a.nom as armateur_nom',
                't.nom as nom_transitaire',
                'sc.camion_id',
                'sc.remorque_id',
                'sc.date_sortie',
                'sc.date_retour',
                'sc.prime_chauffeur',
                'sc.destination',
                'sc.type_transport',
                'sc.type_detention',
                'sc.jours_gratuits',
                'sc.statut as statut_ops',
            ])
            // Ne synchroniser que les conteneurs actifs
            ->whereIn('sc.statut', ['en_cours', 'livre', 'retourne'])
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
                'type_conteneur' => $opsConteneur->type_conteneur,
                'armateur_code' => $opsConteneur->code_armateur,
                'armateur_nom' => $opsConteneur->armateur_nom,
                'client_nom' => $opsConteneur->nom_client,
                'client_adresse' => null,
                'transitaire_nom' => $opsConteneur->nom_transitaire,
                'date_sortie' => $opsConteneur->date_sortie,
                'date_retour' => $opsConteneur->date_retour,
                'camion_id_externe' => $opsConteneur->camion_id,
                'remorque_id_externe' => $opsConteneur->remorque_id,
                'prime_chauffeur' => $opsConteneur->prime_chauffeur,
                'destination_type' => $opsConteneur->type_detention,
                'destination_adresse' => $opsConteneur->destination,
                'statut_ops' => $opsConteneur->statut_ops,
                'statut' => 'en_attente',
                'source_system' => 'logistiga_ops',
                'synced_at' => now(),
            ]);

            // Enrichir les types de conteneurs par armateur
            if (!empty($opsConteneur->type_conteneur) && !empty($opsConteneur->code_armateur)) {
                $armateur = Armateur::where('code', $opsConteneur->code_armateur)->first();
                if ($armateur && !empty($opsConteneur->type_conteneur)) {
                    $armateur->update(['type_conteneur' => $opsConteneur->type_conteneur]);
                }
            }

            $this->conteneursImported++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Détecte les conteneurs "oubliés": présents dans OPS mais absents d'un OT existant
     * pour le même client + BL
     */
    private function detecterAnomalies(): void
    {
        $this->info('🔍 Détection des anomalies (conteneurs oubliés)...');

        // Récupérer toutes les combinaisons uniques client+BL depuis OPS
        $combinaisonsOps = DB::connection('ops')
            ->table('sorties_conteneurs')
            ->select([
                DB::raw('UPPER(TRIM(nom_client)) as client_normalise'),
                DB::raw('UPPER(TRIM(numero_bl)) as bl_normalise'),
                'nom_client',
                'numero_bl',
            ])
            ->whereIn('statut', ['retourne_port', 'livre_client', 'a_la_base'])
            ->whereNull('deleted_at')
            ->whereNotNull('numero_bl')
            ->groupBy('client_normalise', 'bl_normalise', 'nom_client', 'numero_bl')
            ->get();

        $bar = $this->output->createProgressBar($combinaisonsOps->count());
        $bar->start();

        foreach ($combinaisonsOps as $combi) {
            // Récupérer tous les conteneurs OPS pour cette combinaison
            $conteneursOps = DB::connection('ops')
                ->table('sorties_conteneurs')
                ->whereRaw('UPPER(TRIM(nom_client)) = ?', [$combi->client_normalise])
                ->whereRaw('UPPER(TRIM(numero_bl)) = ?', [$combi->bl_normalise])
                ->whereIn('statut', ['retourne_port', 'livre_client', 'a_la_base'])
                ->whereNull('deleted_at')
                ->pluck('numero_conteneur')
                ->map(fn($n) => strtoupper(trim($n)))
                ->unique()
                ->values()
                ->toArray();

            // Chercher l'OT correspondant dans FAC
            $ordre = OrdreTravail::whereHas('client', function ($q) use ($combi) {
                    $q->whereRaw('UPPER(TRIM(nom)) = ?', [$combi->client_normalise]);
                })
                ->whereRaw('UPPER(TRIM(numero_bl)) = ?', [$combi->bl_normalise])
                ->with('conteneurs')
                ->first();

            if ($ordre) {
                // OT existe: vérifier s'il manque des conteneurs
                $conteneursOt = $ordre->conteneurs
                    ->pluck('numero')
                    ->map(fn($n) => strtoupper(trim($n)))
                    ->unique()
                    ->values()
                    ->toArray();

                // Conteneurs présents dans OPS mais absents de l'OT
                $manquants = array_diff($conteneursOps, $conteneursOt);

                if (!empty($manquants)) {
                    // Vérifier si anomalie déjà enregistrée pour cet OT
                    foreach ($manquants as $numConteneur) {
                        $existeDeja = ConteneurAnomalie::where('ordre_travail_id', $ordre->id)
                            ->where('numero_conteneur', $numConteneur)
                            ->where('statut', 'non_traite')
                            ->exists();

                        if (!$existeDeja && !$this->option('dry-run')) {
                            ConteneurAnomalie::create([
                                'type' => 'oublie',
                                'numero_conteneur' => $numConteneur,
                                'numero_bl' => $combi->numero_bl,
                                'client_nom' => $combi->nom_client,
                                'ordre_travail_id' => $ordre->id,
                                'details' => [
                                    'conteneurs_ops' => $conteneursOps,
                                    'conteneurs_ot' => $conteneursOt,
                                    'manquants' => array_values($manquants),
                                    'date_detection' => now()->toIso8601String(),
                                ],
                                'statut' => 'non_traite',
                                'detected_at' => now(),
                            ]);
                            $this->anomaliesDetected++;
                        }

                        if ($this->option('dry-run')) {
                            $this->line("   [DRY-RUN] Anomalie: {$numConteneur} oublié dans OT {$ordre->numero}");
                        }
                    }
                }
            }
            // Si pas d'OT, les conteneurs restent dans "en_attente" (comportement normal)

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
                ['Anomalies détectées', $this->anomaliesDetected, '-', '-'],
            ]
        );

        if ($this->option('dry-run')) {
            $this->warn('⚠️  Mode dry-run: aucune donnée n\'a été modifiée');
        }
    }
}
