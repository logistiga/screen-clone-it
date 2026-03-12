<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiMemory extends Model
{
    protected $table = 'ai_memory';

    protected $fillable = [
        'session_id', 'user_id', 'role', 'content', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function getHistory(string $sessionId, int $limit = 20): array
    {
        return self::where('session_id', $sessionId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->sortBy('created_at')
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->values()
            ->toArray();
    }

    public static function saveMessage(string $sessionId, ?int $userId, string $role, string $content, ?array $metadata = null): self
    {
        return self::create([
            'session_id' => $sessionId,
            'user_id' => $userId,
            'role' => $role,
            'content' => $content,
            'metadata' => $metadata,
        ]);
    }
}
