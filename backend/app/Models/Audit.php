<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Audit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'module',
        'document_type',
        'document_id',
        'document_numero',
        'details',
        'ip_address',
        'user_agent',
        'old_values',
        'new_values',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeModule($query, $module)
    {
        return $query->where('module', $module);
    }

    public function scopeAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopePeriode($query, $debut, $fin)
    {
        return $query->whereBetween('created_at', [$debut, $fin]);
    }

    // Méthodes statiques
    public static function log($action, $module, $details = null, $document = null, $oldValues = null, $newValues = null)
    {
        return self::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'module' => $module,
            'document_type' => $document ? class_basename($document) : null,
            'document_id' => $document?->id,
            'document_numero' => $document?->numero ?? null,
            'details' => $details,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}
