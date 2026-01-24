<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConteneurTraite;
use App\Models\OrdreTravail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ConteneurTraiteController extends Controller
{
    /**
     * Liste des conteneurs traités (reçus de Logistiga OPS)
     */
    public function index(Request $request): JsonResponse
    {
        $query = ConteneurTraite::query();

        // Filtrage par statut
        if ($request->filled('statut')) {
            if ($request->statut === 'non_traites') {
                $query->nonTraites();
            } else {
                $query->where('statut', $request->statut);
            }
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero_conteneur', 'like', "%{$search}%")
                  ->orWhere('numero_bl', 'like', "%{$search}%")
                  ->orWhere('client_nom', 'like', "%{$search}%")
                  ->orWhere('armateur_nom', 'like', "%{$search}%")
                  ->orWhere('transitaire_nom', 'like', "%{$search}%");
            });
        }

        // Filtrage par date
        if ($request->filled('date_from')) {
            $query->whereDate('date_sortie', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_sortie', '<=', $request->date_to);
        }

        // Tri et pagination
        $conteneurs = $query
            ->with(['ordreTravail', 'processedBy'])
            ->orderBy('synced_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => $conteneurs->items(),
            'pagination' => [
                'current_page' => $conteneurs->currentPage(),
                'last_page' => $conteneurs->lastPage(),
                'per_page' => $conteneurs->perPage(),
                'total' => $conteneurs->total(),
            ],
        ]);
    }

    /**
     * Webhook pour recevoir les conteneurs traités depuis Logistiga OPS
     * Route publique protégée par API Key
     */
    public function receiveFromOps(Request $request): JsonResponse
    {
        // Vérifier l'API Key
        $apiKey = $request->header('Authorization') ?? $request->header('X-API-Key');
        $expectedKey = config('services.logistiga_ops.webhook_key');
        
        if ($expectedKey && $apiKey !== $expectedKey && $apiKey !== "Bearer {$expectedKey}") {
            Log::warning('[ConteneurTraite] API Key invalide', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['success' => false, 'message' => 'API Key invalide'], 401);
        }

        $validator = Validator::make($request->all(), [
            'numero_conteneur' => 'required|string|max:20',
            'numero_bl' => 'nullable|string|max:100',
            'armateur' => 'nullable|array',
            'armateur.code' => 'nullable|string|max:20',
            'armateur.nom' => 'nullable|string|max:255',
            'client' => 'nullable|array',
            'client.nom' => 'nullable|string|max:255',
            'client.adresse' => 'nullable|string',
            'transitaire' => 'nullable|array',
            'transitaire.nom' => 'nullable|string|max:255',
            'dates' => 'nullable|array',
            'dates.sortie' => 'nullable|date',
            'dates.retour' => 'nullable|date',
            'vehicule' => 'nullable|array',
            'chauffeur' => 'nullable|array',
            'destination' => 'nullable|array',
            'statut' => 'nullable|string|max:50',
            'sortie_id' => 'nullable|integer',
            'source_system' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            Log::warning('[ConteneurTraite] Validation échouée', [
                'errors' => $validator->errors()->toArray(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $request->all();
            
            // Vérifier si le conteneur existe déjà (par sortie_id_externe)
            $sortieId = $data['sortie_id'] ?? null;
            if ($sortieId) {
                $existing = ConteneurTraite::where('sortie_id_externe', (string)$sortieId)->first();
                if ($existing) {
                    // Mettre à jour les données
                    $existing->update($this->mapOpsData($data));
                    Log::info('[ConteneurTraite] Conteneur mis à jour', [
                        'id' => $existing->id,
                        'numero' => $existing->numero_conteneur,
                    ]);
                    return response()->json([
                        'success' => true,
                        'message' => 'Conteneur mis à jour',
                        'id' => $existing->id,
                    ]);
                }
            }

            // Créer le nouveau conteneur
            $conteneur = ConteneurTraite::create($this->mapOpsData($data));

            Log::info('[ConteneurTraite] Conteneur reçu depuis OPS', [
                'id' => $conteneur->id,
                'numero' => $conteneur->numero_conteneur,
                'bl' => $conteneur->numero_bl,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Conteneur reçu avec succès',
                'id' => $conteneur->id,
            ], 201);

        } catch (\Exception $e) {
            Log::error('[ConteneurTraite] Erreur réception', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur interne',
            ], 500);
        }
    }

    /**
     * Mapper les données reçues de OPS vers le format de la table
     */
    private function mapOpsData(array $data): array
    {
        return [
            'sortie_id_externe' => isset($data['sortie_id']) ? (string)$data['sortie_id'] : null,
            'numero_conteneur' => $data['numero_conteneur'],
            'numero_bl' => $data['numero_bl'] ?? null,
            'armateur_code' => $data['armateur']['code'] ?? null,
            'armateur_nom' => $data['armateur']['nom'] ?? null,
            'client_nom' => $data['client']['nom'] ?? null,
            'client_adresse' => $data['client']['adresse'] ?? null,
            'transitaire_nom' => $data['transitaire']['nom'] ?? null,
            'date_sortie' => $data['dates']['sortie'] ?? null,
            'date_retour' => $data['dates']['retour'] ?? null,
            'camion_id_externe' => $data['vehicule']['camion']['id'] ?? null,
            'camion_plaque' => $data['vehicule']['camion']['plaque'] ?? null,
            'remorque_id_externe' => $data['vehicule']['remorque']['id'] ?? null,
            'remorque_plaque' => $data['vehicule']['remorque']['plaque'] ?? null,
            'chauffeur_nom' => $data['chauffeur']['nom'] ?? null,
            'prime_chauffeur' => $data['chauffeur']['prime'] ?? null,
            'destination_type' => $data['destination']['type'] ?? null,
            'destination_adresse' => $data['destination']['adresse'] ?? null,
            'statut_ops' => $data['statut'] ?? null,
            'source_system' => $data['source_system'] ?? 'logistiga_ops',
            'synced_at' => now(),
        ];
    }

    /**
     * Affecter un conteneur traité à un ordre de travail existant
     */
    public function affecterAOrdre(Request $request, ConteneurTraite $conteneur): JsonResponse
    {
        $request->validate([
            'ordre_travail_id' => 'required|exists:ordres_travail,id',
        ]);

        try {
            DB::beginTransaction();

            $ordre = OrdreTravail::findOrFail($request->ordre_travail_id);
            
            // Ajouter le conteneur à l'ordre s'il n'y est pas déjà
            $conteneurs = $ordre->conteneurs ?? collect();
            $exists = $conteneurs->where('numero', $conteneur->numero_conteneur)->isNotEmpty();
            
            if (!$exists) {
                // Ajouter via la relation
                $ordre->conteneurs()->create([
                    'numero' => $conteneur->numero_conteneur,
                    // Ajouter d'autres champs si nécessaire
                ]);
            }

            // Marquer le conteneur comme affecté
            $conteneur->affecter($ordre, Auth::id());

            DB::commit();

            Log::info('[ConteneurTraite] Conteneur affecté à OT', [
                'conteneur_id' => $conteneur->id,
                'ordre_id' => $ordre->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Conteneur affecté à l\'ordre de travail',
                'ordre' => [
                    'id' => $ordre->id,
                    'numero' => $ordre->numero,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('[ConteneurTraite] Erreur affectation', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'affectation',
            ], 500);
        }
    }

    /**
     * Créer un nouvel ordre de travail à partir d'un conteneur traité
     */
    public function creerOrdre(Request $request, ConteneurTraite $conteneur): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Trouver ou créer le client
            $client = \App\Models\Client::firstOrCreate(
                ['nom' => $conteneur->client_nom ?? 'Client inconnu'],
                ['code' => strtoupper(substr($conteneur->client_nom ?? 'CLI', 0, 3)) . rand(100, 999)]
            );

            // Créer l'ordre de travail
            $ordre = OrdreTravail::create([
                'numero' => OrdreTravail::genererNumero(),
                'client_id' => $client->id,
                'date' => now(),
                'categorie' => 'conteneurs',
                'statut' => 'brouillon',
                'numero_bl' => $conteneur->numero_bl,
                'armateur_id' => null, // À mapper si nécessaire
                'transitaire_id' => null, // À mapper si nécessaire
            ]);

            // Ajouter le conteneur
            $ordre->conteneurs()->create([
                'numero' => $conteneur->numero_conteneur,
            ]);

            // Marquer le conteneur comme affecté
            $conteneur->affecter($ordre, Auth::id());

            DB::commit();

            Log::info('[ConteneurTraite] Nouvel OT créé depuis conteneur', [
                'conteneur_id' => $conteneur->id,
                'ordre_id' => $ordre->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ordre de travail créé avec succès',
                'ordre' => [
                    'id' => $ordre->id,
                    'numero' => $ordre->numero,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('[ConteneurTraite] Erreur création OT', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
            ], 500);
        }
    }

    /**
     * Ignorer un conteneur traité
     */
    public function ignorer(ConteneurTraite $conteneur): JsonResponse
    {
        $conteneur->ignorer(Auth::id());

        return response()->json([
            'success' => true,
            'message' => 'Conteneur ignoré',
        ]);
    }

    /**
     * Statistiques des conteneurs traités
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => ConteneurTraite::count(),
            'en_attente' => ConteneurTraite::enAttente()->count(),
            'affectes' => ConteneurTraite::affectes()->count(),
            'factures' => ConteneurTraite::factures()->count(),
            'derniere_sync' => ConteneurTraite::max('synced_at'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
