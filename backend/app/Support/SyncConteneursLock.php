<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Verrou global (MySQL GET_LOCK) empêchant deux synchronisations de conteneurs simultanées,
 * quelle que soit l'origine (bouton, auto-sync, commande artisan, cron).
 * Le verrou est libéré automatiquement par MySQL si le processus meurt.
 */
final class SyncConteneursLock
{
    private const NOM = 'logistiga_sync_conteneurs';

    /** Exécute $callback sous verrou ; retourne null si une synchro est déjà en cours. */
    public static function executer(callable $callback): mixed
    {
        $obtenu = (int) (DB::selectOne('SELECT GET_LOCK(?, 0) AS l', [self::NOM])->l ?? 0) === 1;
        if (!$obtenu) {
            Log::info('[SyncLock] Synchronisation conteneurs déjà en cours, appel ignoré');
            return null;
        }
        try {
            return $callback();
        } finally {
            try { DB::selectOne('SELECT RELEASE_LOCK(?) AS r', [self::NOM]); } catch (\Throwable) {}
        }
    }
}
