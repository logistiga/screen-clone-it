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
}
