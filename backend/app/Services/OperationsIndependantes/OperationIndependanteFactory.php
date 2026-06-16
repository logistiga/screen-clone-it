<?php

namespace App\Services\OperationsIndependantes;

class OperationIndependanteFactory
{
    protected LocationService $locationService;
    protected TransportService $transportService;
    protected ManutentionService $manutentionService;
    protected DoubleRelevageService $doubleRelevageService;
    protected StockageService $stockageService;
    protected AutreService $autreService;

    public function __construct(
        LocationService $locationService,
        TransportService $transportService,
        ManutentionService $manutentionService,
        DoubleRelevageService $doubleRelevageService,
        StockageService $stockageService,
        AutreService $autreService
    ) {
        $this->locationService = $locationService;
        $this->transportService = $transportService;
        $this->manutentionService = $manutentionService;
        $this->doubleRelevageService = $doubleRelevageService;
        $this->stockageService = $stockageService;
        $this->autreService = $autreService;
    }

    public function getService(string $typeOperation)
    {
        return match ($typeOperation) {
            'location' => $this->locationService,
            'transport' => $this->transportService,
            'manutention' => $this->manutentionService,
            'double_relevage' => $this->doubleRelevageService,
            'stockage' => $this->stockageService,
            'autre' => $this->autreService,
            default => $this->autreService,
        };
    }

    public function getTypesDisponibles(): array
    {
        return [
            'transport' => TransportService::LABEL,
            'location' => LocationService::LABEL,
            'manutention' => ManutentionService::LABEL,
            'autre' => AutreService::LABEL,
        ];
    }

    public function validerLigne(array $ligne): array
    {
        $typeOperation = $ligne['type_operation'] ?? '';
        if (empty($typeOperation)) {
            return ['Type d\'opération requis'];
        }
        return $this->getService($typeOperation)->validerDonnees($ligne);
    }

    public function normaliserLigne(array $ligne): array
    {
        $typeOperation = $ligne['type_operation'] ?? 'autre';
        return $this->getService($typeOperation)->normaliserLigne($ligne);
    }

    public function calculerMontant(array $ligne): float
    {
        $typeOperation = $ligne['type_operation'] ?? 'autre';
        return $this->getService($typeOperation)->calculerMontant($ligne);
    }

    public function getChampsSpecifiques(string $typeOperation): array
    {
        return $this->getService($typeOperation)->getChampsSpecifiques();
    }
}
