<?php

namespace App\Services;

use App\Models\Client;
use App\Models\OrdreTravail;
use App\Models\Transitaire;
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
        $this->baseUrl = rtrim(config('services.logistiga_ops.url', 'https://opt.logistiga.com/backend/api'), '/');
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
     * Méthode générique pour envoyer une requête HTTP vers OPS
     */
    protected function sendRequest(string $method, string $endpoint, array $data = []): array
    {
        if (!$this->isSyncEnabled()) {
            Log::info('[LogistigaAPI] Sync désactivée ou API Key manquante');
            return ['success' => false, 'message' => 'Synchronisation désactivée'];
        }

        try {
            $url = "{$this->baseUrl}{$endpoint}";
            
            $response = Http::timeout($this->timeout)
                ->withHeaders($this->getHeaders())
                ->$method($url, $data);

            if ($response->failed()) {
                Log::error("[LogistigaAPI] Erreur {$endpoint}", [
                    'status' => $response->status(),
                    'response' => $response->json(),
                    'data' => $data,
                ]);
                return [
                    'success' => false,
                    'message' => $response->json('message') ?? 'Erreur de communication',
                    'status' => $response->status(),
                ];
            }

            Log::info("[LogistigaAPI] Succès {$endpoint}", [
                'response' => $response->json(),
            ]);

            return [
                'success' => true,
                'data' => $response->json(),
            ];

        } catch (\Exception $e) {
            Log::error("[LogistigaAPI] Exception {$endpoint}", [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Envoie un ordre de travail conteneurs vers Logistiga OPS
     */
    public function sendOrdreTravail(array $data): array
    {
        return $this->sendRequest('post', '/webhook/sorties-attente', [
            'external_ordre_id' => (int) ($data['external_id'] ?? 0),
            'numero_ot' => $data['numero_ot'] ?? '',
            'numero_bl' => $data['booking_number'],
            'client_id' => (int) ($data['client_id'] ?? 0),
            'client_nom' => $data['client_nom'],
            'transitaire_nom' => $data['transitaire_nom'] ?? null,
            'armateur_code' => $data['armateur_code'] ?? null,
            'containers' => collect($data['containers'])->map(fn($c) => [
                'numero_conteneur' => $c['numero_conteneur'],
                'taille' => $c['taille'] ?? '20',
                'destination' => $c['destination'] ?? null,
            ])->toArray(),
        ]);
    }

    /**
     * Prépare les données d'un ordre de travail conteneurs pour l'envoi
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
            'numero_ot' => $ordre->numero,
            'booking_number' => $ordre->numero_bl,
            'client_id' => $ordre->client_id,
            'client_nom' => $ordre->client->nom ?? '',
            'transitaire_nom' => $ordre->transitaire->nom ?? null,
            'armateur_code' => $ordre->armateur->code ?? null,
            'containers' => $conteneurs->map(fn($c) => [
                'numero_conteneur' => $c->numero,
                'taille' => $c->taille ?? '20',
                'destination' => $c->destination ?? null,
            ])->toArray(),
        ];
    }

    /**
     * Synchronise un client vers Logistiga OPS
     */
    public function syncClient(Client $client): array
    {
        return $this->sendRequest('post', '/webhook/clients', [
            'external_id' => $client->id,
            'code' => 'CLI-' . str_pad($client->id, 5, '0', STR_PAD_LEFT),
            'nom' => $client->nom,
            'telephone' => $client->telephone,
            'email' => $client->email,
            'adresse' => $client->adresse,
            'actif' => true,
        ]);
    }

    /**
     * Synchronise un transitaire vers Logistiga OPS
     */
    public function syncTransitaire(Transitaire $transitaire): array
    {
        return $this->sendRequest('post', '/webhook/transitaires', [
            'external_id' => $transitaire->id,
            'code' => 'TRA-' . str_pad($transitaire->id, 5, '0', STR_PAD_LEFT),
            'nom' => $transitaire->nom,
            'contact_nom' => $transitaire->contact_principal,
            'telephone' => $transitaire->telephone,
            'email' => $transitaire->email,
            'adresse' => $transitaire->adresse,
            'actif' => $transitaire->actif ?? true,
        ]);
    }

    /**
     * Envoie les lots conventionnels d'un ordre vers Logistiga OPS
     */
    public function sendLotsConventionnels(OrdreTravail $ordre): array
    {
        $ordre->load(['client', 'lots']);
        
        $lots = $ordre->lots ?? collect();
        if ($lots->isEmpty()) {
            return ['success' => false, 'message' => 'Aucun lot à envoyer'];
        }

        return $this->sendRequest('post', '/webhook/lots-attente', [
            'external_ordre_id' => $ordre->id,
            'numero_ot' => $ordre->numero,
            'numero_bl' => $ordre->numero_bl,
            'client_id' => $ordre->client_id,
            'client_nom' => $ordre->client->nom ?? '',
            'lots' => $lots->map(fn($l) => [
                'description' => $l->description,
                'quantite' => (float) $l->quantite,
                'unite' => 'unites',
            ])->toArray(),
        ]);
    }

    /**
     * Récupère les options d'armateurs depuis Logistiga OPS
     */
    public function getArmateursOptions(): array
    {
        return $this->sendRequest('get', '/armateurs-options');
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
     * Récupère les conteneurs traités depuis Logistiga OPS
     * Ces conteneurs sont ceux qui ont été retournés au port côté OPS
     */
    public function fetchConteneursTraites(array $filters = []): array
    {
        // Utiliser GET /sorties avec filtre statut=retourne_port
        $params = array_merge([
            'statut' => 'retourne_port',
            'per_page' => 100,
        ], $filters);

        // Convertir date_from/date_to vers date_debut/date_fin pour l'API OPS
        if (isset($params['date_from'])) {
            $params['date_debut'] = $params['date_from'];
            unset($params['date_from']);
        }
        if (isset($params['date_to'])) {
            $params['date_fin'] = $params['date_to'];
            unset($params['date_to']);
        }

        $endpoint = '/sorties?' . http_build_query($params);

        return $this->sendRequest('get', $endpoint);
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
