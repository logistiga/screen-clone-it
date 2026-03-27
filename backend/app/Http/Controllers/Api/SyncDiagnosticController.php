<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Diagnostic OPS - Sync déléguée à SyncConteneursController
 */
class SyncDiagnosticController extends Controller
{
    use SyncDiagnosticHelpersTrait;

    public function healthOps()
    {
        try {
            $this->refreshOpsConfigFromEnv();
            $opsConfig = config('database.connections.ops');
            
            if (empty($opsConfig['host']) || empty($opsConfig['database'])) {
                return response()->json(['success' => false, 'message' => 'Connexion OPS non configurée', 'debug' => ['host_configured' => !empty($opsConfig['host']), 'database_configured' => !empty($opsConfig['database'])]], 503);
            }

            $result = DB::connection('ops')->select('SELECT 1 as test');
            
            if (!empty($result)) {
                $tables = DB::connection('ops')->select('SHOW TABLES');
                return response()->json(['success' => true, 'message' => 'Connexion OPS réussie', 'debug' => ['host' => $opsConfig['host'], 'database' => $opsConfig['database'], 'tables_count' => count($tables)]]);
            }

            return response()->json(['success' => false, 'message' => 'Connexion OPS échouée'], 503);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur de connexion OPS', 'debug' => ['error' => $e->getMessage()]], 503);
        }
    }

    // === Délégation sync ===
    public function syncConteneurs() { return app(SyncConteneursController::class)->syncConteneurs(); }
    public function syncArmateurs() { return app(SyncConteneursController::class)->syncArmateurs(); }
    public function syncAll() { return app(SyncConteneursController::class)->syncAll(); }
}
