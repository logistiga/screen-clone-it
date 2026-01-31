<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConteneurTraite;
use App\Models\OrdreTravail;
use App\Services\LogistigaApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

    /**
     * Vérifie la connectivité avec Logistiga OPS
     */
    public function healthOps(): JsonResponse
    {
        $health = $this->logistigaService->checkHealth();

        return response()->json([
            'success' => $health['connected'] ?? false,
            'connected' => $health['connected'] ?? false,
            'status' => $health['status'] ?? 0,
            'message' => $health['message'] ?? 'Statut inconnu',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Synchronise les conteneurs traités depuis Logistiga OPS
     * Récupère les sorties terminées et les importe dans la table locale
     */
    public function syncConteneursFromOps(Request $request): JsonResponse
    {
        try {
            $filters = [
                'date_from' => $request->get('date_from', now()->subDays(30)->format('Y-m-d')),
                'date_to' => $request->get('date_to', now()->format('Y-m-d')),
            ];

            $result = $this->logistigaService->fetchConteneursTraites($filters);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'Erreur lors de la récupération des conteneurs',
                ], 400);
            }

            $conteneurs = $result['data']['data'] ?? $result['data'] ?? [];
            $imported = 0;
            $updated = 0;

            foreach ($conteneurs as $data) {
                $sortieId = $data['id'] ?? null;
                
                $existing = $sortieId 
                    ? ConteneurTraite::where('sortie_id_externe', (string) $sortieId)->first()
                    : null;

                // Mapping adapté à la structure SortieConteneurResource de OPS
                $mappedData = [
                    'sortie_id_externe' => $sortieId ? (string) $sortieId : null,
                    'numero_conteneur' => $data['numero_conteneur'] ?? '',
                    'numero_bl' => $data['numero_bl'] ?? null,
                    'armateur_code' => $data['code_armateur'] ?? $data['armateur']['code'] ?? null,
                    'armateur_nom' => $data['armateur']['nom'] ?? null,
                    'client_nom' => $data['nom_client'] ?? $data['client']['nom'] ?? null,
                    'client_adresse' => $data['client']['adresse'] ?? null,
                    'transitaire_nom' => $data['transitaire']['nom'] ?? null,
                    'date_sortie' => $data['date_sortie'] ?? null,
                    'date_retour' => $data['date_retour'] ?? null,
                    'camion_plaque' => $data['camion']['plaque'] ?? null,
                    'remorque_plaque' => $data['remorque']['plaque'] ?? null,
                    'chauffeur_nom' => $data['chauffeur']['nom'] ?? null,
                    'prime_chauffeur' => $data['prime']['montant'] ?? null,
                    'destination_type' => $data['destination_type'] ?? null,
                    'destination_adresse' => $data['destination_adresse'] ?? null,
                    'statut_ops' => $data['statut'] ?? 'retourne_port',
                    'source_system' => 'logistiga_ops',
                    'synced_at' => now(),
                ];

                if ($existing) {
                    $existing->update($mappedData);
                    $updated++;
                } else {
                    ConteneurTraite::create($mappedData);
                    $imported++;
                }
            }

            Log::info('[SyncOPS] Conteneurs synchronisés', [
                'total_recu' => count($conteneurs),
                'importes' => $imported,
                'mis_a_jour' => $updated,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Synchronisation terminée : {$imported} importés, {$updated} mis à jour",
                'stats' => [
                    'received' => count($conteneurs),
                    'imported' => $imported,
                    'updated' => $updated,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('[SyncOPS] Erreur synchronisation', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation : ' . $e->getMessage(),
            ], 500);
        }
    }
}
