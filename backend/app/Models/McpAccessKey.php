<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/** Clé d'accès au serveur MCP LOGISTIGA (lecture seule). Seule l'empreinte est stockée. */
class McpAccessKey extends Model
{
    public const PREFIX = 'lgmcp_';

    protected $fillable = ['name', 'description', 'key_prefix', 'key_hash', 'created_by', 'expires_at'];

    protected $hidden = ['key_hash'];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_used_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public static function hashKey(string $plain): string
    {
        return hash('sha256', $plain);
    }

    /** Génère une clé aléatoire (48 caractères après le préfixe). */
    public static function generatePlain(): string
    {
        return self::PREFIX . Str::random(48);
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null && ($this->expires_at === null || $this->expires_at->isFuture());
    }

    public function statut(): string
    {
        if ($this->revoked_at !== null) {
            return 'revoquee';
        }
        return $this->isActive() ? 'active' : 'expiree';
    }
}
