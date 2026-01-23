<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrdreTravail;
use App\Services\LogistigaApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogistigaSyncController extends Controller
{
    protected LogistigaApiService $logistigaService;

    public function __construct(LogistigaApiService $logistigaService)
    {
        $this->logistigaService = $logistigaService;
    }

    /**
     * Envoie un ordre de travail vers Logistiga
     */
    public function sendToLogistiga(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_number' => 'required|string|max:100',
            'client_nom' => 'required|string|max:255',
            'transitaire_nom' => 'nullable|string|max:255',
            'containers' => 'required|array|min:1',
            'containers.*.numero_conteneur' => 'required|string|max:20',
        ]);

        $result = $this->logistigaService->sendOrdreTravail($validated);

        return response()->json($result, $result['success'] ? 201 : 400);
    }

    /**
     * Envoie un ordre existant vers Logistiga par son ID
     */
    public function sendOrdreById(OrdreTravail $ordreTravail): JsonResponse
    {
        $ordreTravail->load(['client', 'transitaire', 'conteneurs']);

        $data = $this->logistigaService->prepareOrdreData($ordreTravail);

        if (!$data) {
            return response()->json([
                'success' => false,
                'message' => 'Ordre non éligible pour Logistiga (pas conteneur, pas de BL, ou pas de conteneurs)',
            ], 422);
        }

        $result = $this->logistigaService->sendOrdreTravail($data);

        return response()->json($result, $result['success'] ? 201 : 400);
    }
}
