<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConteneurAnomalieResource;
use App\Models\ConteneurAnomalie;
use App\Models\OrdreTravail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConteneurAnomalieController extends Controller
{
    /**
     * Liste des anomalies détectées
     */
    public function index(Request $request): JsonResponse
    {
        $query = ConteneurAnomalie::with(['ordreTravail', 'traitePar']);

        // Filtrage par statut
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        } else {
            // Par défaut: non traitées
            $query->where('statut', 'non_traite');
        }

        // Filtrage par type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero_conteneur', 'like', "%{$search}%")
                  ->orWhere('numero_bl', 'like', "%{$search}%")
                  ->orWhere('client_nom', 'like', "%{$search}%");
            });
        }

        $anomalies = $query
            ->orderBy('detected_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data' => ConteneurAnomalieResource::collection($anomalies),
            'pagination' => [
                'current_page' => $anomalies->currentPage(),
                'last_page' => $anomalies->lastPage(),
                'per_page' => $anomalies->perPage(),
                'total' => $anomalies->total(),
            ],
        ]);
    }

    /**
     * Statistiques des anomalies
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => ConteneurAnomalie::count(),
            'non_traitees' => ConteneurAnomalie::where('statut', 'non_traite')->count(),
            'traitees' => ConteneurAnomalie::where('statut', 'traite')->count(),
            'ignorees' => ConteneurAnomalie::where('statut', 'ignore')->count(),
            'par_type' => [
                'oublie' => ConteneurAnomalie::where('type', 'oublie')->where('statut', 'non_traite')->count(),
                'doublon' => ConteneurAnomalie::where('type', 'doublon')->where('statut', 'non_traite')->count(),
                'mismatch' => ConteneurAnomalie::where('type', 'mismatch')->where('statut', 'non_traite')->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Ajouter le conteneur manquant à l'OT existant
     */
    public function ajouterAOrdre(ConteneurAnomalie $anomalie): JsonResponse
    {
        if (!$anomalie->ordre_travail_id) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun ordre de travail associé à cette anomalie',
            ], 400);
        }

        try {
            DB::beginTransaction();

            $ordre = OrdreTravail::findOrFail($anomalie->ordre_travail_id);

            // Vérifier que le conteneur n'existe pas déjà
            $existe = $ordre->conteneurs()
                ->whereRaw('UPPER(TRIM(numero)) = ?', [strtoupper(trim($anomalie->numero_conteneur))])
                ->exists();

            if ($existe) {
                // Marquer comme traité quand même
                $anomalie->traiter(Auth::id());
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Conteneur déjà présent dans l\'ordre, anomalie résolue',
                ]);
            }

            // Ajouter le conteneur à l'OT
            $ordre->conteneurs()->create([
                'numero' => $anomalie->numero_conteneur,
            ]);

            // Marquer l'anomalie comme traitée
            $anomalie->traiter(Auth::id());

            DB::commit();

            Log::info('[Anomalie] Conteneur ajouté à OT', [
                'anomalie_id' => $anomalie->id,
                'conteneur' => $anomalie->numero_conteneur,
                'ordre_id' => $ordre->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Conteneur {$anomalie->numero_conteneur} ajouté à l'ordre {$ordre->numero}",
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('[Anomalie] Erreur ajout conteneur', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout',
            ], 500);
        }
    }

    /**
     * Ignorer une anomalie
     */
    public function ignorer(ConteneurAnomalie $anomalie): JsonResponse
    {
        $anomalie->ignorer(Auth::id());

        return response()->json([
            'success' => true,
            'message' => 'Anomalie ignorée',
        ]);
    }

    /**
     * Traiter plusieurs anomalies en masse
     */
    public function traiterEnMasse(Request $request): JsonResponse
    {
        $request->validate([
            'anomalie_ids' => 'required|array',
            'anomalie_ids.*' => 'exists:conteneurs_anomalies,id',
            'action' => 'required|in:ajouter,ignorer',
        ]);

        $compteur = 0;
        $erreurs = [];

        DB::beginTransaction();

        try {
            foreach ($request->anomalie_ids as $anomalieId) {
                $anomalie = ConteneurAnomalie::find($anomalieId);
                
                if (!$anomalie || $anomalie->statut !== 'non_traite') {
                    continue;
                }

                if ($request->action === 'ajouter') {
                    if ($anomalie->ordre_travail_id) {
                        $ordre = OrdreTravail::find($anomalie->ordre_travail_id);
                        if ($ordre) {
                            $existe = $ordre->conteneurs()
                                ->whereRaw('UPPER(TRIM(numero)) = ?', [strtoupper(trim($anomalie->numero_conteneur))])
                                ->exists();
                            
                            if (!$existe) {
                                $ordre->conteneurs()->create([
                                    'numero' => $anomalie->numero_conteneur,
                                ]);
                            }
                        }
                    }
                    $anomalie->traiter(Auth::id());
                } else {
                    $anomalie->ignorer(Auth::id());
                }

                $compteur++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$compteur} anomalie(s) traitée(s)",
                'traites' => $compteur,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement en masse',
            ], 500);
        }
    }

    /**
     * Lancer la détection d'anomalies manuellement
     * Exécute la logique directement pour éviter les problèmes de cache Artisan
     */
    public function detecter(): JsonResponse
    {
        try {
            $nouvelles = $this->executeDetectionAnomalies();

            return response()->json([
                'success' => true,
                'message' => "Détection terminée. {$nouvelles} nouvelle(s) anomalie(s) trouvée(s).",
                'nouvelles_anomalies' => $nouvelles,
            ]);

        } catch (\Exception $e) {
            Log::error('[Anomalie] Erreur détection', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la détection: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exécute la détection d'anomalies directement
     * Compare les conteneurs OPS avec les conteneurs des OT locaux
     */
    private function executeDetectionAnomalies(): int
    {
        $nouvelles = 0;

        // Récupérer les conteneurs synchronisés depuis OPS (table conteneurs_traites)
        // Grouper par client + BL pour trouver les OT correspondants
        $conteneursOps = DB::table('conteneurs_traites')
            ->whereNotNull('client_nom')
            ->whereNotNull('numero_bl')
            ->whereNotNull('numero_conteneur')
            ->select('client_nom', 'numero_bl', 'numero_conteneur')
            ->get();

        // Grouper par client+BL
        $groupes = $conteneursOps->groupBy(function ($item) {
            return strtoupper(trim($item->client_nom)) . '|' . strtoupper(trim($item->numero_bl));
        });

        foreach ($groupes as $key => $conteneurs) {
            [$clientNom, $numeroBl] = explode('|', $key);
            
            // Trouver l'OT local correspondant via jointure avec clients
            // La table ordres_travail utilise client_id, pas client_nom
            $ordre = OrdreTravail::join('clients', 'ordres_travail.client_id', '=', 'clients.id')
                ->whereRaw('UPPER(TRIM(clients.nom)) = ?', [$clientNom])
                ->whereRaw('UPPER(TRIM(ordres_travail.numero_bl)) = ?', [$numeroBl])
                ->with('conteneurs')
                ->select('ordres_travail.*')
                ->first();

            if (!$ordre) {
                // Pas d'OT local = pas une anomalie de type "oublié"
                // (c'est un conteneur en attente, pas un oubli)
                continue;
            }

            // Conteneurs dans l'OT local
            $conteneursOt = $ordre->conteneurs->pluck('numero')
                ->map(fn($n) => strtoupper(trim($n)))
                ->toArray();

            // Conteneurs dans OPS
            $conteneursOpsListe = $conteneurs->pluck('numero_conteneur')
                ->map(fn($n) => strtoupper(trim($n)))
                ->toArray();

            // Trouver les manquants (dans OPS mais pas dans l'OT local)
            $manquants = array_diff($conteneursOpsListe, $conteneursOt);

            // Récupérer le nom du client pour l'anomalie
            $ordre->load('client');
            $clientNomPourAnomalie = $ordre->client?->nom ?? $clientNom;

            foreach ($manquants as $numeroConteneur) {
                // Vérifier si cette anomalie n'existe pas déjà
                $existe = ConteneurAnomalie::where('numero_conteneur', $numeroConteneur)
                    ->where('ordre_travail_id', $ordre->id)
                    ->where('statut', 'non_traite')
                    ->exists();

                if (!$existe) {
                    ConteneurAnomalie::create([
                        'type' => 'oublie',
                        'numero_conteneur' => $numeroConteneur,
                        'numero_bl' => $ordre->numero_bl,
                        'client_nom' => $clientNomPourAnomalie,
                        'ordre_travail_id' => $ordre->id,
                        'statut' => 'non_traite',
                        'detected_at' => now(),
                        'details' => [
                            'conteneurs_ops' => $conteneursOpsListe,
                            'conteneurs_ot' => $conteneursOt,
                            'manquants' => array_values($manquants),
                            'date_detection' => now()->toIso8601String(),
                        ],
                    ]);
                    $nouvelles++;
                }
            }
        }

        Log::info('[Anomalie] Détection terminée', [
            'nouvelles_anomalies' => $nouvelles,
        ]);

        return $nouvelles;
    }
}
