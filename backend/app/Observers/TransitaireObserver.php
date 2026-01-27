<?php

namespace App\Observers;

use App\Models\Transitaire;
use App\Services\LogistigaApiService;
use Illuminate\Support\Facades\Log;

class TransitaireObserver
{
    public function __construct(
        protected LogistigaApiService $logistigaService
    ) {}

    /**
     * Handle the Transitaire "created" event.
     */
    public function created(Transitaire $transitaire): void
    {
        $this->syncToOps($transitaire);
    }

    /**
     * Handle the Transitaire "updated" event.
     */
    public function updated(Transitaire $transitaire): void
    {
        $this->syncToOps($transitaire);
    }

    /**
     * Synchronise le transitaire vers Logistiga OPS
     */
    protected function syncToOps(Transitaire $transitaire): void
    {
        try {
            $result = $this->logistigaService->syncTransitaire($transitaire);
            
            if ($result['success'] ?? false) {
                Log::info('[TransitaireObserver] Transitaire synchronisé vers OPS', [
                    'transitaire_id' => $transitaire->id,
                    'nom' => $transitaire->nom,
                ]);
            }
        } catch (\Exception $e) {
            // Ne pas bloquer la création/modification si OPS échoue
            Log::warning('[TransitaireObserver] Sync OPS échouée', [
                'transitaire_id' => $transitaire->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
