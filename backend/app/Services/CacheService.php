<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CacheService
{
    // Durées de cache en secondes
    const TTL_DASHBOARD = 300;      // 5 minutes
    const TTL_STATS = 600;          // 10 minutes
    const TTL_GRAPHIQUES = 900;     // 15 minutes
    const TTL_ALERTES = 120;        // 2 minutes (plus critique)
    const TTL_ACTIVITE = 60;        // 1 minute

    // Préfixes de clés
    const PREFIX_DASHBOARD = 'dashboard:';
    const PREFIX_STATS = 'stats:';

    /**
     * Obtenir ou mettre en cache une valeur
     */
    public static function remember(string $key, int $ttl, callable $callback): mixed
    {
        try {
            return Cache::remember($key, $ttl, $callback);
        } catch (\Throwable $e) {
            Log::warning("Cache miss ou erreur pour {$key}", ['error' => $e->getMessage()]);
            return $callback();
        }
    }

    /**
     * Invalider le cache du dashboard
     */
    public static function invalidateDashboard(): void
    {
        $keys = [
            self::PREFIX_DASHBOARD . 'index:*',
            self::PREFIX_DASHBOARD . 'graphiques:*',
            self::PREFIX_DASHBOARD . 'alertes',
            self::PREFIX_DASHBOARD . 'activite',
        ];

        foreach ($keys as $pattern) {
            self::forgetPattern($pattern);
        }

        Log::info('Cache dashboard invalidé');
    }

    /**
     * Invalider le cache des statistiques d'un module
     */
    public static function invalidateStats(string $module): void
    {
        self::forgetPattern(self::PREFIX_STATS . $module . ':*');
        self::invalidateDashboard(); // Les stats affectent le dashboard
        Log::info("Cache stats {$module} invalidé");
    }

    /**
     * Invalider tout le cache applicatif
     */
    public static function invalidateAll(): void
    {
        Cache::flush();
        Log::info('Cache entier invalidé');
    }

    /**
     * Générer une clé de cache unique basée sur les paramètres
     */
    public static function key(string $prefix, array $params = []): string
    {
        if (empty($params)) {
            return $prefix;
        }
        
        ksort($params);
        return $prefix . ':' . md5(serialize($params));
    }

    /**
     * Supprimer les clés correspondant à un pattern
     * Note: Fonctionne avec Redis. Pour file/database, utiliser tags ou invalidation manuelle
     */
    protected static function forgetPattern(string $pattern): void
    {
        try {
            // Si Redis est disponible
            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $prefix = config('cache.prefix', 'laravel_cache');
                $keys = $redis->keys($prefix . ':' . $pattern);
                
                foreach ($keys as $key) {
                    $redis->del($key);
                }
            } else {
                // Pour les autres drivers, on utilise des clés connues
                Cache::forget(str_replace('*', '', $pattern));
            }
        } catch (\Throwable $e) {
            Log::warning("Erreur lors de l'invalidation du cache", ['pattern' => $pattern, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Vérifier si le cache est disponible
     */
    public static function isAvailable(): bool
    {
        try {
            Cache::put('health_check', true, 1);
            return Cache::get('health_check') === true;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
