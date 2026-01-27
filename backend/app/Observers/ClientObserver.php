<?php

namespace App\Observers;

use App\Models\Client;
use App\Events\ClientCreated;
use App\Services\LogistigaApiService;
use Illuminate\Support\Facades\Log;

class ClientObserver
{
    public function __construct(
        protected LogistigaApiService $logistigaService
    ) {}

    /**
     * Handle the Client "created" event.
     */
    public function created(Client $client): void
    {
        // Dispatcher l'événement au lieu d'appeler directement le service
        event(new ClientCreated($client));
        
        // Sync vers OPS
        $this->syncToOps($client);
    }

    /**
     * Handle the Client "updated" event.
     */
    public function updated(Client $client): void
    {
        $this->syncToOps($client);
    }

    /**
     * Synchronise le client vers Logistiga OPS
     */
    protected function syncToOps(Client $client): void
    {
        try {
            $result = $this->logistigaService->syncClient($client);
            
            if ($result['success'] ?? false) {
                Log::info('[ClientObserver] Client synchronisé vers OPS', [
                    'client_id' => $client->id,
                    'nom' => $client->nom,
                ]);
            }
        } catch (\Exception $e) {
            // Ne pas bloquer la création/modification si OPS échoue
            Log::warning('[ClientObserver] Sync OPS échouée', [
                'client_id' => $client->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
