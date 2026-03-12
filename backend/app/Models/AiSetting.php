<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiSetting extends Model
{
    protected $table = 'ai_settings';

    protected $fillable = [
        'provider', 'api_url', 'api_key', 'model',
        'max_context_length', 'system_prompt', 'is_active', 'extra_config',
    ];

    protected $casts = [
        'extra_config' => 'array',
        'is_active' => 'boolean',
    ];

    protected $hidden = ['api_key'];

    public static function active(): ?self
    {
        return self::where('is_active', true)->first();
    }

    public static function getProviders(): array
    {
        return [
            'ollama' => [
                'label' => 'Ollama (Self-hosted)',
                'models' => ['mistral:7b', 'llama3.2:3b', 'llama3.1:8b', 'codellama:7b', 'phi3:mini'],
                'needs_key' => false,
            ],
            'openai' => [
                'label' => 'OpenAI',
                'models' => ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                'needs_key' => true,
            ],
            'anthropic' => [
                'label' => 'Anthropic (Claude)',
                'models' => ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
                'needs_key' => true,
            ],
            'google' => [
                'label' => 'Google (Gemini)',
                'models' => ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
                'needs_key' => true,
            ],
        ];
    }
}
