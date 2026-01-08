<?php

namespace App\Services\OperationsIndependantes;

use Illuminate\Support\Facades\Log;

/**
 * Factory pour les services d'opérations indépendantes.
 * Route vers le service spécialisé selon le type d'opération.
 */
class OperationIndependanteFactory
{
    protected LocationService $locationService;
    protected TransportService $transportService;
    protected ManutentionService $manutentionService;
    protected DoubleRelevageService $doubleRelevageService;
    protected StockageService $stockageService;

    public function __construct(
        LocationService $locationService,
        TransportService $transportService,
        ManutentionService $manutentionService,
        DoubleRelevageService $doubleRelevageService,
        StockageService $stockageService
    ) {
        $this->locationService = $locationService;
        $this->transportService = $transportService;
        $this->manutentionService = $manutentionService;
        $this->doubleRelevageService = $doubleRelevageService;
        $this->stockageService = $stockageService;
    }

    /**
     * Obtenir le service approprié selon le type d'opération
     */
    public function getService(string $typeOperation): LocationService|TransportService|ManutentionService|DoubleRelevageService|StockageService
    {
        return match ($typeOperation) {
            'location' => $this->locationService,
            'transport' => $this->transportService,
            'manutention' => $this->manutentionService,
            'double_relevage' => $this->doubleRelevageService,
            'stockage' => $this->stockageService,
            default => $this->manutentionService,
        };
    }

    /**
     * Obtenir tous les types d'opérations disponibles
     */
    public function getTypesDisponibles(): array
    {
        return [
            'location' => LocationService::LABEL,
            'transport' => TransportService::LABEL,
            'manutention' => ManutentionService::LABEL,
            'double_relevage' => DoubleRelevageService::LABEL,
            'stockage' => StockageService::LABEL,
        ];
    }

    /**
     * Valider une ligne selon son type d'opération
     */
    public function validerLigne(array $ligne): array
    {
        $typeOperation = $ligne['type_operation'] ?? '';
        
        if (empty($typeOperation)) {
            return ['Type d\'opération requis'];
        }

        $service = $this->getService($typeOperation);
        return $service->validerDonnees($ligne);
    }

    /**
     * Normaliser une ligne selon son type d'opération
     */
    public function normaliserLigne(array $ligne): array
    {
        $typeOperation = $ligne['type_operation'] ?? 'manutention';
        $service = $this->getService($typeOperation);
        
        return $service->normaliserLigne($ligne);
    }

    /**
     * Calculer le montant d'une ligne selon son type
     */
    public function calculerMontant(array $ligne): float
    {
        $typeOperation = $ligne['type_operation'] ?? 'manutention';
        $service = $this->getService($typeOperation);
        
        return $service->calculerMontant($ligne);
    }

    /**
     * Obtenir les champs spécifiques d'un type d'opération
     */
    public function getChampsSpecifiques(string $typeOperation): array
    {
        $service = $this->getService($typeOperation);
        return $service->getChampsSpecifiques();
    }
}
