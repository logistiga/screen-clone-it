<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controller pour le diagnostic et déclenchement manuel de la synchronisation OPS
 */
class SyncDiagnosticController extends Controller
{
    /**
     * Rafraîchit dynamiquement la config OPS depuis les variables d'environnement.
     * Utile si la config est en cache côté Laravel (config:cache) alors que .env a été mis à jour.
     */
    private function refreshOpsConfigFromEnv(): void
    {
        $host = env('OPS_DB_HOST');
        $database = env('OPS_DB_DATABASE');

        // Si l'env n'est pas configuré, on ne touche à rien.
        if (empty($host) || empty($database)) {
            return;
        }

        config([
            'database.connections.ops.host' => $host,
            'database.connections.ops.port' => env('OPS_DB_PORT', '3306'),
            'database.connections.ops.database' => $database,
            'database.connections.ops.username' => env('OPS_DB_USERNAME'),
            'database.connections.ops.password' => env('OPS_DB_PASSWORD'),
            'database.connections.ops.unix_socket' => env('OPS_DB_SOCKET', ''),
        ]);

        // Forcer Laravel à recréer la connexion avec la config à jour
        DB::purge('ops');
    }

    /**
     * Teste la connexion à la base de données OPS
     */
    public function healthOps()
    {
        try {
            $this->refreshOpsConfigFromEnv();

            // Vérifier si la connexion OPS est configurée
            $opsConfig = config('database.connections.ops');
            
            if (empty($opsConfig['host']) || empty($opsConfig['database'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Connexion OPS non configurée',
                    'debug' => [
                        'host_configured' => !empty($opsConfig['host']),
                        'database_configured' => !empty($opsConfig['database']),
                    ]
                ], 503);
            }

            // Tester la connexion
            $result = DB::connection('ops')->select('SELECT 1 as test');
            
            if (!empty($result)) {
                // Compter les tables disponibles
                $tables = DB::connection('ops')->select('SHOW TABLES');
                
                return response()->json([
                    'success' => true,
                    'message' => 'Connexion OPS réussie',
                    'debug' => [
                        'host' => $opsConfig['host'],
                        'database' => $opsConfig['database'],
                        'tables_count' => count($tables),
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Connexion OPS échouée - pas de réponse',
            ], 503);

        } catch (\Exception $e) {
            Log::error('[SyncDiagnostic] Erreur connexion OPS', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur de connexion OPS',
                'debug' => [
                    'error' => $e->getMessage(),
                ]
            ], 503);
        }
    }

    /**
     * Déclenche la synchronisation des conteneurs depuis OPS
     */
    public function syncConteneurs()
    {
        try {
            $this->refreshOpsConfigFromEnv();
            Log::info('[SyncDiagnostic] Déclenchement manuel sync conteneurs');

            // Vérifier d'abord la connexion OPS
            try {
                DB::connection('ops')->getPdo();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de se connecter à la base OPS',
                    'debug' => [
                        'error' => $e->getMessage(),
                    ]
                ], 503);
            }

            // Exécuter la synchronisation directement sans passer par Artisan
            // pour éviter les problèmes de cache de commandes
            $result = $this->executeSyncConteneurs();

            return response()->json([
                'success' => true,
                'message' => 'Synchronisation des conteneurs réussie',
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            Log::error('[SyncDiagnostic] Erreur sync conteneurs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'debug' => [
                    'error' => $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Exécute la synchronisation des conteneurs directement
     */
    private function executeSyncConteneurs(): array
    {
        $imported = 0;
        $skipped = 0;

        // Lecture depuis sorties_conteneurs avec le schéma réel
        $opsConteneurs = DB::connection('ops')
            ->table('sorties_conteneurs')
            ->select([
                'id as sortie_id_externe',
                'numero_conteneur',
                'type_conteneur',
                'numero_bl',
                'code_armateur',
                'nom_client',
                'adresse_client',
                'nom_transitaire',
                'date_sortie',
                'date_retour',
                'camion_id',
                'remorque_id',
                'prime_chauffeur',
                'destination',
                'type_destination',
                'statut as statut_ops',
            ])
            // Conteneurs terminés: retournés au port ou livrés
            ->whereIn('statut', ['retourne_port', 'livre_client', 'a_la_base'])
            ->whereNull('deleted_at')
            ->get();

        foreach ($opsConteneurs as $opsConteneur) {
            // Vérifier si déjà synchronisé
            $existeDejaSync = \App\Models\ConteneurTraite::where('sortie_id_externe', $opsConteneur->sortie_id_externe)->exists();

            if ($existeDejaSync) {
                $skipped++;
                continue;
            }

            // Récupérer le nom de l'armateur depuis le code
            $armateur = DB::connection('ops')
                ->table('armateurs')
                ->where('code', $opsConteneur->code_armateur)
                ->first();

            // Insérer dans conteneurs_traites
            \App\Models\ConteneurTraite::create([
                'sortie_id_externe' => $opsConteneur->sortie_id_externe,
                'numero_conteneur' => $opsConteneur->numero_conteneur,
                'numero_bl' => $opsConteneur->numero_bl,
                'armateur_code' => $opsConteneur->code_armateur,
                'armateur_nom' => $armateur->nom ?? null,
                'client_nom' => $opsConteneur->nom_client,
                'client_adresse' => $opsConteneur->adresse_client,
                'transitaire_nom' => $opsConteneur->nom_transitaire,
                'date_sortie' => $opsConteneur->date_sortie,
                'date_retour' => $opsConteneur->date_retour,
                'camion_id_externe' => $opsConteneur->camion_id,
                'remorque_id_externe' => $opsConteneur->remorque_id,
                'prime_chauffeur' => $opsConteneur->prime_chauffeur,
                'destination_type' => $opsConteneur->type_destination,
                'destination_adresse' => null,
                'statut_ops' => $opsConteneur->statut_ops,
                'statut' => 'en_attente',
                'source_system' => 'logistiga_ops',
                'synced_at' => now(),
            ]);

            $imported++;
        }

        Log::info('[SyncDiagnostic] Sync conteneurs terminée', [
            'imported' => $imported,
            'skipped' => $skipped,
        ]);

        return [
            'conteneurs_importes' => $imported,
            'conteneurs_ignores' => $skipped,
        ];
    }

    /**
     * Déclenche la synchronisation des armateurs depuis OPS
     */
    public function syncArmateurs()
    {
        try {
            $this->refreshOpsConfigFromEnv();
            Log::info('[SyncDiagnostic] Déclenchement manuel sync armateurs');

            // Vérifier d'abord la connexion OPS
            try {
                DB::connection('ops')->getPdo();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de se connecter à la base OPS',
                    'debug' => [
                        'error' => $e->getMessage(),
                    ]
                ], 503);
            }

            // Exécuter la commande Artisan
            $exitCode = Artisan::call('sync:from-ops', [
                '--armateurs' => true,
            ]);

            $output = Artisan::output();

            if ($exitCode === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'Synchronisation des armateurs réussie',
                    'debug' => [
                        'output' => $output,
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Échec de la synchronisation des armateurs',
                'debug' => [
                    'exit_code' => $exitCode,
                    'output' => $output,
                ]
            ], 500);

        } catch (\Exception $e) {
            Log::error('[SyncDiagnostic] Erreur sync armateurs', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation des armateurs',
                'debug' => [
                    'error' => $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Synchronisation complète (conteneurs + armateurs)
     */
    public function syncAll()
    {
        try {
            $this->refreshOpsConfigFromEnv();
            Log::info('[SyncDiagnostic] Déclenchement manuel sync complète');

            // Vérifier d'abord la connexion OPS
            try {
                DB::connection('ops')->getPdo();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de se connecter à la base OPS',
                    'debug' => [
                        'error' => $e->getMessage(),
                    ]
                ], 503);
            }

            // Exécuter la commande Artisan sans options (sync tout)
            $exitCode = Artisan::call('sync:from-ops');
            $output = Artisan::output();

            if ($exitCode === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'Synchronisation complète réussie',
                    'debug' => [
                        'output' => $output,
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Échec de la synchronisation complète',
                'debug' => [
                    'exit_code' => $exitCode,
                    'output' => $output,
                ]
            ], 500);

        } catch (\Exception $e) {
            Log::error('[SyncDiagnostic] Erreur sync complète', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'debug' => [
                    'error' => $e->getMessage(),
                ]
            ], 500);
        }
    }
}
