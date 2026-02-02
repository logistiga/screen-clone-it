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
     * Teste la connexion à la base de données OPS
     */
    public function healthOps()
    {
        try {
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

            // Exécuter la commande Artisan
            $exitCode = Artisan::call('sync:from-ops', [
                '--conteneurs' => true,
            ]);

            $output = Artisan::output();

            if ($exitCode === 0) {
                Log::info('[SyncDiagnostic] Sync conteneurs réussie', [
                    'output' => $output,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Synchronisation des conteneurs réussie',
                    'debug' => [
                        'output' => $output,
                    ]
                ]);
            }

            Log::warning('[SyncDiagnostic] Sync conteneurs échouée', [
                'exit_code' => $exitCode,
                'output' => $output,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Échec de la synchronisation',
                'debug' => [
                    'exit_code' => $exitCode,
                    'output' => $output,
                ]
            ], 500);

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
     * Déclenche la synchronisation des armateurs depuis OPS
     */
    public function syncArmateurs()
    {
        try {
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
