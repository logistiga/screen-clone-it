<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LogistigaApiService
{
    protected string $baseUrl = 'https://suivitc.logistiga.com/backend/api';

    /**
     * Envoie un ordre de travail vers Logistiga
     */
    public function sendOrdreTravail(array $data): array
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post("{$this->baseUrl}/ordres-externes", [
                    'booking_number' => $data['booking_number'],
                    'client_nom' => $data['client_nom'],
                    'transitaire_nom' => $data['transitaire_nom'] ?? null,
                    'containers' => collect($data['containers'])->map(fn($c) => [
                        'numero_conteneur' => $c['numero_conteneur'],
                    ])->toArray(),
                ]);

            if ($response->failed()) {
                Log::error('[LogistigaAPI] Erreur', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                ]);
                return ['success' => false, 'message' => $response->json('message') ?? 'Erreur de communication'];
            }

            Log::info('[LogistigaAPI] Ordre envoyé avec succès', [
                'booking_number' => $data['booking_number'],
                'response' => $response->json(),
            ]);

            return $response->json();

        } catch (\Exception $e) {
            Log::error('[LogistigaAPI] Exception', ['error' => $e->getMessage()]);
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
            'booking_number' => $ordre->numero_bl,
            'client_nom' => $ordre->client->nom ?? '',
            'transitaire_nom' => $ordre->transitaire->nom ?? null,
            'containers' => $conteneurs->map(fn($c) => [
                'numero_conteneur' => $c->numero,
            ])->toArray(),
        ];
    }
}
