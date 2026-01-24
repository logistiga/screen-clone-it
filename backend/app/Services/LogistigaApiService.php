<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LogistigaApiService
{
    protected string $baseUrl;
    protected ?string $apiKey;
    protected int $timeout;
    protected bool $syncEnabled;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.logistiga_ops.url', 'https://suivitc.logistiga.com/backend/api'), '/');
        $this->apiKey = config('services.logistiga_ops.api_key');
        $this->timeout = (int) config('services.logistiga_ops.timeout', 30);
        $this->syncEnabled = (bool) config('services.logistiga_ops.sync_enabled', true);
    }

    /**
     * Vérifie si la synchronisation est activée
     */
    public function isSyncEnabled(): bool
    {
        return $this->syncEnabled && !empty($this->apiKey);
    }

    /**
     * Envoie un ordre de travail vers Logistiga OPS
     */
    public function sendOrdreTravail(array $data): array
    {
        if (!$this->isSyncEnabled()) {
            Log::info('[LogistigaAPI] Synchronisation désactivée ou API Key manquante');
            return ['success' => false, 'message' => 'Synchronisation désactivée'];
        }

        try {
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->post("{$this->baseUrl}/ordres-externes", [
                    'booking_number' => $data['booking_number'],
                    'client_nom' => $data['client_nom'],
                    'transitaire_nom' => $data['transitaire_nom'] ?? null,
                    'armateur_nom' => $data['armateur_nom'] ?? null,
                    'external_id' => $data['external_id'] ?? null,
                    'containers' => collect($data['containers'])->map(fn($c) => [
                        'numero_conteneur' => $c['numero_conteneur'],
                        'type' => $c['type'] ?? null,
                    ])->toArray(),
                ]);

            if ($response->failed()) {
                Log::error('[LogistigaAPI] Erreur envoi OT', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                    'booking_number' => $data['booking_number'],
                ]);
                return [
                    'success' => false, 
                    'message' => $response->json('message') ?? 'Erreur de communication',
                    'status' => $response->status(),
                ];
            }

            Log::info('[LogistigaAPI] Ordre envoyé avec succès', [
                'booking_number' => $data['booking_number'],
                'response' => $response->json(),
            ]);

            return [
                'success' => true,
                'data' => $response->json(),
            ];

        } catch (\Exception $e) {
            Log::error('[LogistigaAPI] Exception', [
                'error' => $e->getMessage(),
                'booking_number' => $data['booking_number'] ?? null,
            ]);
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Prépare les données d'un ordre de travail pour l'envoi
     */
    public function prepareOrdreData($ordre): ?array
    {
        // Vérifier que c'est un ordre conteneur avec les données nécessaires
        if ($ordre->categorie !== 'conteneurs' || !$ordre->numero_bl) {
            return null;
        }

        $conteneurs = $ordre->conteneurs ?? collect();
        if ($conteneurs->isEmpty()) {
            return null;
        }

        return [
            'external_id' => (string) $ordre->id,
            'booking_number' => $ordre->numero_bl,
            'client_nom' => $ordre->client->nom ?? '',
            'transitaire_nom' => $ordre->transitaire->nom ?? null,
            'armateur_nom' => $ordre->armateur->nom ?? null,
            'containers' => $conteneurs->map(fn($c) => [
                'numero_conteneur' => $c->numero,
                'type' => $c->type ?? null,
            ])->toArray(),
        ];
    }

    /**
     * Vérifie la connectivité avec Logistiga OPS
     */
    public function checkHealth(): array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders($this->getHeaders())
                ->get("{$this->baseUrl}/health");

            return [
                'connected' => $response->successful(),
                'status' => $response->status(),
                'message' => $response->successful() ? 'Connecté à Logistiga OPS' : 'Erreur de connexion',
            ];
        } catch (\Exception $e) {
            return [
                'connected' => false,
                'status' => 0,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Headers pour les requêtes vers Logistiga OPS
     */
    protected function getHeaders(): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'X-Source' => 'logistiga_facturation',
        ];

        if ($this->apiKey) {
            $headers['Authorization'] = "Bearer {$this->apiKey}";
            $headers['X-API-Key'] = $this->apiKey;
        }

        return $headers;
    }
}
