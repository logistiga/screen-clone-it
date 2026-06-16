<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\DB;

/**
 * Trait partagé pour la config OPS
 */
trait SyncDiagnosticHelpersTrait
{
    private function refreshOpsConfigFromEnv(): void
    {
        $host = env('OPS_DB_HOST');
        $database = env('OPS_DB_DATABASE');

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

        DB::purge('ops');
    }

    /**
     * Recharge la config de la connexion OPS Indépendantes (logiwkuh_OPS) depuis le .env
     * Fallback sur OPS_DB_* si OPSIND_DB_* n'est pas défini.
     */
    private function refreshOpsIndConfigFromEnv(): void
    {
        $host = env('OPSIND_DB_HOST', env('OPS_DB_HOST'));
        $database = env('OPSIND_DB_DATABASE');

        if (empty($host) || empty($database)) {
            return;
        }

        config([
            'database.connections.ops_ind.host' => $host,
            'database.connections.ops_ind.port' => env('OPSIND_DB_PORT', env('OPS_DB_PORT', '3306')),
            'database.connections.ops_ind.database' => $database,
            'database.connections.ops_ind.username' => env('OPSIND_DB_USERNAME', env('OPS_DB_USERNAME')),
            'database.connections.ops_ind.password' => env('OPSIND_DB_PASSWORD', env('OPS_DB_PASSWORD')),
            'database.connections.ops_ind.unix_socket' => env('OPSIND_DB_SOCKET', ''),
        ]);

        DB::purge('ops_ind');
    }
}
