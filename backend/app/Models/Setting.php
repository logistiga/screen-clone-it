<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'description',
    ];

    /**
     * Les types de valeurs possibles
     */
    public const TYPES = [
        'string' => 'Texte',
        'integer' => 'Nombre entier',
        'float' => 'Nombre décimal',
        'boolean' => 'Booléen',
        'json' => 'JSON',
        'encrypted' => 'Chiffré',
    ];

    /**
     * Les groupes de paramètres
     */
    public const GROUPS = [
        'general' => 'Général',
        'mail' => 'Email',
        'facturation' => 'Facturation',
        'notifications' => 'Notifications',
        'securite' => 'Sécurité',
    ];

    /**
     * Obtenir une valeur de paramètre
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }

        return $setting->getCastedValue();
    }

    /**
     * Définir une valeur de paramètre
     */
    public static function set(string $key, $value, ?string $group = null, ?string $type = 'string'): static
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_array($value) ? json_encode($value) : $value,
                'group' => $group,
                'type' => $type,
            ]
        );
    }

    /**
     * Obtenir la valeur castée selon le type
     */
    public function getCastedValue()
    {
        return match ($this->type) {
            'integer' => (int) $this->value,
            'float' => (float) $this->value,
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($this->value, true),
            'encrypted' => $this->value ? decrypt($this->value) : null,
            default => $this->value,
        };
    }

    /**
     * Scope par groupe
     */
    public function scopeForGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    /**
     * Obtenir tous les paramètres d'un groupe
     */
    public static function getGroup(string $group): array
    {
        $settings = static::forGroup($group)->get();
        
        $result = [];
        foreach ($settings as $setting) {
            $result[$setting->key] = $setting->getCastedValue();
        }
        
        return $result;
    }
}
