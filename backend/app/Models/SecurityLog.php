<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model pour les logs de sécurité
 * Stocke les événements critiques : auth, exports, modifications sensibles
 */
class SecurityLog extends Model
{
    use HasFactory;

    protected $table = 'security_logs';

    protected $fillable = [
        'event_type',
        'user_id',
        'user_email',
        'ip_address',
        'user_agent',
        'method',
        'path',
        'status_code',
        'duration_ms',
        'context',
    ];

    protected $casts = [
        'context' => 'array',
        'duration_ms' => 'float',
        'status_code' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope pour les événements d'authentification
     */
    public function scopeAuthEvents($query)
    {
        return $query->where('event_type', 'like', 'auth.%');
    }

    /**
     * Scope pour les exports
     */
    public function scopeExportEvents($query)
    {
        return $query->where('event_type', 'like', 'export.%');
    }

    /**
     * Scope pour les événements échoués
     */
    public function scopeFailed($query)
    {
        return $query->whereNotIn('status_code', [200, 201, 204]);
    }

    /**
     * Scope pour les événements critiques (erreurs 401, 403, 429)
     */
    public function scopeCritical($query)
    {
        return $query->whereIn('status_code', [401, 403, 429, 500]);
    }

    /**
     * Scope par IP
     */
    public function scopeByIp($query, string $ip)
    {
        return $query->where('ip_address', $ip);
    }

    /**
     * Scope par période
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Détecte les tentatives de brute force (>5 échecs login en 5 min)
     */
    public static function detectBruteForce(string $ip, int $threshold = 5, int $minutes = 5): bool
    {
        return self::where('event_type', 'auth.login')
            ->where('ip_address', $ip)
            ->where('status_code', '!=', 200)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count() >= $threshold;
    }

    /**
     * Obtient les statistiques de sécurité
     */
    public static function getStats(int $days = 7): array
    {
        $since = now()->subDays($days);

        return [
            'total_events' => self::where('created_at', '>=', $since)->count(),
            'failed_logins' => self::authEvents()->failed()->where('created_at', '>=', $since)->count(),
            'exports' => self::exportEvents()->where('created_at', '>=', $since)->count(),
            'critical_events' => self::critical()->where('created_at', '>=', $since)->count(),
            'unique_ips' => self::where('created_at', '>=', $since)->distinct('ip_address')->count('ip_address'),
        ];
    }
}
