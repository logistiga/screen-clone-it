<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Appels aux providers IA (Ollama, DeepSeek, OpenAI, Anthropic, Google)
 */
class AiProviderController extends Controller
{
    public function callProvider(AiSetting $setting, string $systemPrompt, array $messages): string
    {
        $allMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $messages
        );

        $extra = $setting->extra_config ?? [];

        return match ($setting->provider) {
            'ollama' => $this->callOllama($setting, $allMessages, $extra),
            'deepseek' => $this->callDeepSeek($setting, $allMessages, $extra),
            'openai' => $this->callOpenAI($setting, $allMessages, $extra),
            'anthropic' => $this->callAnthropic($setting, $allMessages, $extra),
            'google' => $this->callGoogle($setting, $allMessages, $extra),
            default => throw new \Exception("Provider non supporté: {$setting->provider}"),
        };
    }

    public function callOllama(AiSetting $setting, array $messages, array $extra): string
    {
        $baseUrl = rtrim((string) $setting->api_url, '/');
        $baseUrl = preg_replace('#/(api|v1)(/.*)?$#', '', $baseUrl);

        $chatPayload = [
            'model' => $setting->model,
            'messages' => $messages,
            'stream' => false,
            'options' => [
                'temperature' => $extra['temperature'] ?? 0.7,
                'num_predict' => $extra['max_tokens'] ?? 2000,
            ],
        ];

        $primaryUrl = $baseUrl . '/api/chat';
        Log::info('Ollama request primary endpoint', ['url' => $primaryUrl, 'model' => $setting->model]);

        $response = Http::timeout(120)
            ->withHeaders(['Content-Type' => 'application/json', 'Accept' => 'application/json'])
            ->post($primaryUrl, $chatPayload);

        if ($response->status() === 405) {
            Log::warning('Ollama /api/chat returned 405, trying OpenAI-compatible endpoints', ['base_url' => $baseUrl]);

            $fallbackUrls = [$baseUrl . '/v1/chat/completions', $baseUrl . '/chat/completions'];
            $fallbackPayload = [
                'model' => $setting->model,
                'messages' => $messages,
                'temperature' => $extra['temperature'] ?? 0.7,
                'max_tokens' => $extra['max_tokens'] ?? 2000,
            ];

            foreach ($fallbackUrls as $fallbackUrl) {
                $fallbackResponse = Http::timeout(120)
                    ->withHeaders(['Content-Type' => 'application/json', 'Accept' => 'application/json'])
                    ->post($fallbackUrl, $fallbackPayload);

                if ($fallbackResponse->successful()) {
                    return $fallbackResponse->json('choices.0.message.content')
                        ?? $fallbackResponse->json('message.content')
                        ?? 'Pas de réponse.';
                }
            }
        }

        if (!$response->successful()) {
            throw new \Exception("Ollama error ({$response->status()}): " . $response->body());
        }

        return $response->json('message.content') ?? $response->json('choices.0.message.content') ?? 'Pas de réponse.';
    }

    public function callDeepSeek(AiSetting $setting, array $messages, array $extra): string
    {
        if (!$setting->api_key) throw new \Exception('Clé API DeepSeek non configurée.');

        $response = Http::withHeaders(['Authorization' => 'Bearer ' . $setting->api_key])
            ->timeout(120)->post('https://api.deepseek.com/v1/chat/completions', [
                'model' => $setting->model, 'messages' => $messages,
                'temperature' => $extra['temperature'] ?? 0.7, 'max_tokens' => $extra['max_tokens'] ?? 2000,
            ]);

        if (!$response->successful()) throw new \Exception("DeepSeek error ({$response->status()}): " . $response->body());
        return $response->json('choices.0.message.content') ?? 'Pas de réponse.';
    }

    public function callOpenAI(AiSetting $setting, array $messages, array $extra): string
    {
        $apiKey = $setting->api_key ?: config('services.openai.key');
        if (!$apiKey) throw new \Exception('Clé API OpenAI non configurée.');

        $endpoint = $setting->api_url ?: 'https://api.openai.com/v1/chat/completions';

        $response = Http::withHeaders(['Authorization' => 'Bearer ' . $apiKey])
            ->timeout(60)->post($endpoint, [
                'model' => $setting->model, 'messages' => $messages,
                'temperature' => $extra['temperature'] ?? 0.7, 'max_tokens' => $extra['max_tokens'] ?? 2000,
            ]);

        if (!$response->successful()) throw new \Exception("OpenAI error ({$response->status()}): " . $response->body());
        return $response->json('choices.0.message.content') ?? 'Pas de réponse.';
    }

    public function callAnthropic(AiSetting $setting, array $messages, array $extra): string
    {
        if (!$setting->api_key) throw new \Exception('Clé API Anthropic non configurée.');

        $system = '';
        $filtered = [];
        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') { $system .= $msg['content'] . "\n"; }
            else { $filtered[] = $msg; }
        }

        $response = Http::withHeaders(['x-api-key' => $setting->api_key, 'anthropic-version' => '2023-06-01'])
            ->timeout(60)->post('https://api.anthropic.com/v1/messages', [
                'model' => $setting->model, 'system' => trim($system), 'messages' => $filtered,
                'max_tokens' => $extra['max_tokens'] ?? 2000, 'temperature' => $extra['temperature'] ?? 0.7,
            ]);

        if (!$response->successful()) throw new \Exception("Anthropic error ({$response->status()}): " . $response->body());
        return $response->json('content.0.text') ?? 'Pas de réponse.';
    }

    public function callGoogle(AiSetting $setting, array $messages, array $extra): string
    {
        if (!$setting->api_key) throw new \Exception('Clé API Google non configurée.');

        $system = '';
        $contents = [];
        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') { $system .= $msg['content'] . "\n"; }
            else {
                $contents[] = [
                    'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                    'parts' => [['text' => $msg['content']]],
                ];
            }
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$setting->model}:generateContent?key={$setting->api_key}";

        $body = ['contents' => $contents];
        if ($system) { $body['systemInstruction'] = ['parts' => [['text' => trim($system)]]]; }
        $body['generationConfig'] = ['temperature' => $extra['temperature'] ?? 0.7, 'maxOutputTokens' => $extra['max_tokens'] ?? 2000];

        $response = Http::timeout(60)->post($url, $body);

        if (!$response->successful()) throw new \Exception("Google error ({$response->status()}): " . $response->body());
        return $response->json('candidates.0.content.parts.0.text') ?? 'Pas de réponse.';
    }
}
