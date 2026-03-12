<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiMemory;
use App\Models\AiSetting;
use App\Models\Client;
use App\Models\ConteneurAnomalie;
use App\Models\ConteneurTraite;
use App\Models\CreditBancaire;
use App\Models\Facture;
use App\Models\MouvementCaisse;
use App\Models\Notification;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiAssistantController extends Controller
{
    /**
     * Chat avec l'assistant IA (multi-provider + mémoire)
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:5000',
            'session_id' => 'nullable|string|max:100',
        ]);

        $setting = AiSetting::active();
        if (!$setting) {
            return response()->json(['error' => 'Aucun provider IA configuré.'], 500);
        }

        $userId = $request->user()?->id;
        $sessionId = $request->input('session_id', Str::uuid()->toString());
        $userMessage = $request->input('message');

        try {
            // Save user message
            AiMemory::saveMessage($sessionId, $userId, 'user', $userMessage);

            // Get conversation history
            $history = AiMemory::getHistory($sessionId, $setting->max_context_length);

            // Build context
            $businessContext = $this->getBusinessContext();
            $systemPrompt = $this->buildSystemPrompt($setting, $businessContext);

            // Call AI provider
            $response = $this->callProvider($setting, $systemPrompt, $history);

            // Save assistant response
            AiMemory::saveMessage($sessionId, $userId, 'assistant', $response, [
                'provider' => $setting->provider,
                'model' => $setting->model,
            ]);

            return response()->json([
                'message' => $response,
                'session_id' => $sessionId,
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('AI Connection Timeout', ['error' => $e->getMessage(), 'provider' => $setting->provider]);
            return response()->json([
                'error' => 'Le serveur IA est injoignable. Vérifiez que Ollama est démarré sur le VPS (systemctl restart ollama).',
                'details' => $e->getMessage(),
            ], 503);
        } catch (\Exception $e) {
            Log::error('AI Chat Error', ['error' => $e->getMessage(), 'provider' => $setting->provider]);
            return response()->json([
                'error' => 'Erreur de communication avec l\'IA: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Historique des conversations
     */
    public function history(Request $request): JsonResponse
    {
        $sessionId = $request->query('session_id');
        if (!$sessionId) {
            // Return list of sessions
            $sessions = AiMemory::select('session_id', DB::raw('MIN(created_at) as started_at'), DB::raw('MAX(created_at) as last_message_at'), DB::raw('COUNT(*) as message_count'))
                ->where('user_id', $request->user()?->id)
                ->groupBy('session_id')
                ->orderByDesc('last_message_at')
                ->limit(50)
                ->get();
            return response()->json($sessions);
        }

        $messages = AiMemory::where('session_id', $sessionId)
            ->orderBy('created_at')
            ->get(['role', 'content', 'metadata', 'created_at']);
        return response()->json($messages);
    }

    /**
     * Contexte métier
     */
    public function context(): JsonResponse
    {
        try {
            return response()->json($this->getBusinessContext());
        } catch (\Exception $e) {
            return response()->json(['error' => 'Impossible de charger le contexte.'], 500);
        }
    }

    /**
     * Settings CRUD
     */
    public function getSettings(): JsonResponse
    {
        $setting = AiSetting::active();
        $providers = AiSetting::getProviders();
        return response()->json([
            'setting' => $setting,
            'providers' => $providers,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'provider' => 'required|in:ollama,deepseek,openai,anthropic,google',
            'api_url' => 'nullable|string|max:500',
            'api_key' => 'nullable|string|max:500',
            'model' => 'required|string|max:100',
            'max_context_length' => 'integer|min:1|max:100',
            'system_prompt' => 'nullable|string|max:5000',
            'extra_config' => 'nullable|array',
        ]);

        $setting = AiSetting::active() ?? new AiSetting();
        $data = $request->only(['provider', 'api_url', 'model', 'max_context_length', 'system_prompt', 'extra_config']);
        
        // Only update api_key if provided (don't clear it)
        if ($request->filled('api_key')) {
            $data['api_key'] = $request->input('api_key');
        }
        
        $data['is_active'] = true;
        $setting->fill($data);
        $setting->save();

        return response()->json(['message' => 'Paramètres IA mis à jour.', 'setting' => $setting]);
    }

    public function testConnection(Request $request): JsonResponse
    {
        $setting = AiSetting::active();
        if (!$setting) {
            return response()->json(['success' => false, 'error' => 'Aucun provider configuré.']);
        }

        try {
            $response = $this->callProvider($setting, 'Réponds juste "OK" en un mot.', [
                ['role' => 'user', 'content' => 'Test de connexion. Réponds OK.']
            ]);
            return response()->json(['success' => true, 'response' => $response]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // ========== Private methods ==========

    protected function callProvider(AiSetting $setting, string $systemPrompt, array $messages): string
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

    protected function callOllama(AiSetting $setting, array $messages, array $extra): string
    {
        // Normalize URL: remove trailing slash and common suffixes
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

        // Some proxies expose OpenAI-compatible endpoints only
        if ($response->status() === 405) {
            Log::warning('Ollama /api/chat returned 405, trying OpenAI-compatible endpoints', ['base_url' => $baseUrl]);

            $fallbackUrls = [
                $baseUrl . '/v1/chat/completions',
                $baseUrl . '/chat/completions',
            ];

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

                Log::warning('Ollama fallback failed', [
                    'url' => $fallbackUrl,
                    'status' => $fallbackResponse->status(),
                ]);
            }
        }

        if (!$response->successful()) {
            throw new \Exception("Ollama error ({$response->status()}): " . $response->body());
        }

        return $response->json('message.content')
            ?? $response->json('choices.0.message.content')
            ?? 'Pas de réponse.';
    }

    protected function callDeepSeek(AiSetting $setting, array $messages, array $extra): string
    {
        if (!$setting->api_key) throw new \Exception('Clé API DeepSeek non configurée.');

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $setting->api_key,
        ])->timeout(120)->post('https://api.deepseek.com/v1/chat/completions', [
            'model' => $setting->model,
            'messages' => $messages,
            'temperature' => $extra['temperature'] ?? 0.7,
            'max_tokens' => $extra['max_tokens'] ?? 2000,
        ]);

        if (!$response->successful()) {
            throw new \Exception("DeepSeek error ({$response->status()}): " . $response->body());
        }

        return $response->json('choices.0.message.content') ?? 'Pas de réponse.';
    }

    protected function callOpenAI(AiSetting $setting, array $messages, array $extra): string
    {
        $apiKey = $setting->api_key ?: config('services.openai.key');
        if (!$apiKey) throw new \Exception('Clé API OpenAI non configurée.');

        $endpoint = $setting->api_url ?: 'https://api.openai.com/v1/chat/completions';

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
        ])->timeout(60)->post($endpoint, [
            'model' => $setting->model,
            'messages' => $messages,
            'temperature' => $extra['temperature'] ?? 0.7,
            'max_tokens' => $extra['max_tokens'] ?? 2000,
        ]);

        if (!$response->successful()) {
            throw new \Exception("OpenAI error ({$response->status()}): " . $response->body());
        }

        return $response->json('choices.0.message.content') ?? 'Pas de réponse.';
    }

    protected function callAnthropic(AiSetting $setting, array $messages, array $extra): string
    {
        if (!$setting->api_key) throw new \Exception('Clé API Anthropic non configurée.');

        // Extract system from messages
        $system = '';
        $filtered = [];
        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                $system .= $msg['content'] . "\n";
            } else {
                $filtered[] = $msg;
            }
        }

        $response = Http::withHeaders([
            'x-api-key' => $setting->api_key,
            'anthropic-version' => '2023-06-01',
        ])->timeout(60)->post('https://api.anthropic.com/v1/messages', [
            'model' => $setting->model,
            'system' => trim($system),
            'messages' => $filtered,
            'max_tokens' => $extra['max_tokens'] ?? 2000,
            'temperature' => $extra['temperature'] ?? 0.7,
        ]);

        if (!$response->successful()) {
            throw new \Exception("Anthropic error ({$response->status()}): " . $response->body());
        }

        return $response->json('content.0.text') ?? 'Pas de réponse.';
    }

    protected function callGoogle(AiSetting $setting, array $messages, array $extra): string
    {
        if (!$setting->api_key) throw new \Exception('Clé API Google non configurée.');

        // Convert to Gemini format
        $system = '';
        $contents = [];
        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                $system .= $msg['content'] . "\n";
            } else {
                $contents[] = [
                    'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                    'parts' => [['text' => $msg['content']]],
                ];
            }
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$setting->model}:generateContent?key={$setting->api_key}";

        $body = ['contents' => $contents];
        if ($system) {
            $body['systemInstruction'] = ['parts' => [['text' => trim($system)]]];
        }
        $body['generationConfig'] = [
            'temperature' => $extra['temperature'] ?? 0.7,
            'maxOutputTokens' => $extra['max_tokens'] ?? 2000,
        ];

        $response = Http::timeout(60)->post($url, $body);

        if (!$response->successful()) {
            throw new \Exception("Google error ({$response->status()}): " . $response->body());
        }

        return $response->json('candidates.0.content.parts.0.text') ?? 'Pas de réponse.';
    }

    protected function getBusinessContext(): array
    {
        $context = [];

        try {
            $context['clients'] = [
                'total' => Client::count(),
                'nouveaux_ce_mois' => Client::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)->count(),
            ];
        } catch (\Exception $e) {
            $context['clients'] = ['error' => 'Non disponible'];
        }

        try {
            $context['factures'] = [
                'total' => Facture::count(),
                'impayees' => Facture::whereIn('statut', ['envoyee', 'en_retard'])->count(),
                'montant_impaye' => round((float) Facture::whereIn('statut', ['envoyee', 'en_retard'])->sum('montant_ttc'), 2),
                'ce_mois' => Facture::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)->count(),
            ];
        } catch (\Exception $e) {
            $context['factures'] = ['error' => 'Non disponible'];
        }

        try {
            $context['paiements'] = [
                'total_mois' => round((float) Paiement::whereMonth('date_paiement', now()->month)
                    ->whereYear('date_paiement', now()->year)->sum('montant'), 2),
            ];
        } catch (\Exception $e) {
            $context['paiements'] = ['error' => 'Non disponible'];
        }

        try {
            $entrees = MouvementCaisse::where('type', 'entree')->sum('montant');
            $sorties = MouvementCaisse::where('type', 'sortie')->sum('montant');
            $context['caisse'] = [
                'solde' => round((float) ($entrees - $sorties), 2),
                'entrees_mois' => round((float) MouvementCaisse::where('type', 'entree')
                    ->whereMonth('date_mouvement', now()->month)
                    ->whereYear('date_mouvement', now()->year)->sum('montant'), 2),
                'sorties_mois' => round((float) MouvementCaisse::where('type', 'sortie')
                    ->whereMonth('date_mouvement', now()->month)
                    ->whereYear('date_mouvement', now()->year)->sum('montant'), 2),
            ];
        } catch (\Exception $e) {
            $context['caisse'] = ['error' => 'Non disponible'];
        }

        try {
            $context['top_clients'] = Facture::select('client_id', DB::raw('SUM(montant_ttc) as total_ca'))
                ->groupBy('client_id')
                ->orderByDesc('total_ca')
                ->limit(5)
                ->with('client:id,nom')
                ->get()
                ->map(fn($f) => [
                    'nom' => $f->client->nom ?? 'Inconnu',
                    'ca' => round((float) $f->total_ca, 2),
                ])
                ->toArray();
        } catch (\Exception $e) {
            $context['top_clients'] = [];
        }

        try {
            $context['notifications_recentes'] = Notification::orderByDesc('created_at')
                ->limit(10)
                ->get(['type', 'title', 'message', 'created_at'])
                ->toArray();
        } catch (\Exception $e) {
            $context['notifications_recentes'] = [];
        }

        try {
            $context['conteneurs_flotte'] = ConteneurTraite::orderByDesc('created_at')
                ->limit(15)
                ->get(['numero_conteneur', 'camion_plaque', 'chauffeur_nom', 'statut', 'destination_adresse', 'date_sortie'])
                ->toArray();
        } catch (\Exception $e) {
            $context['conteneurs_flotte'] = [];
        }

        try {
            $context['anomalies_en_cours'] = ConteneurAnomalie::where('resolved', false)
                ->limit(10)
                ->get(['numero_conteneur', 'type_anomalie', 'description', 'created_at'])
                ->toArray();
        } catch (\Exception $e) {
            $context['anomalies_en_cours'] = [];
        }

        try {
            $context['credits_bancaires'] = CreditBancaire::where('statut', 'actif')
                ->get(['banque_id', 'montant_total', 'montant_restant', 'date_echeance'])
                ->toArray();
        } catch (\Exception $e) {
            $context['credits_bancaires'] = [];
        }

        $context['date_contexte'] = now()->format('d/m/Y H:i');

        return $context;
    }

    protected function buildSystemPrompt(AiSetting $setting, array $context): string
    {
        $contextJson = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $basePrompt = $setting->system_prompt ?: "Tu es l'assistant de Omar, directeur de Logistiga au Gabon. Flotte de 40 camions. Port d'Owendo. Équipe: Mustapha, Georgia, Mohamed, Evans. Réponds en français, de manière professionnelle et concise.";

        return <<<PROMPT
{$basePrompt}

## Contexte métier actuel (données en temps réel)
```json
{$contextJson}
```

## Règles
- Utilise les données ci-dessus pour contextualiser tes réponses
- Les montants sont en FCFA
- Sois précis avec les chiffres, ne les invente pas
- Si une donnée n'est pas disponible, dis-le clairement
- Propose des actions concrètes quand c'est pertinent
- Utilise du markdown pour structurer tes réponses (titres, listes, tableaux)
PROMPT;
    }
}
