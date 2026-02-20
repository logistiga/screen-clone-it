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

class ConteneurTraiteController extends Controller
{
    /**
     * Liste des conteneurs traités en attente de facturation.
     * 
     * LOGIQUE MÉTIER:
     * Un conteneur s'affiche dans "en attente" UNIQUEMENT s'il n'existe pas 
     * dans un ordre de travail avec la même combinaison:
     * - Nom client (client_nom ↔ client.nom)
     * - Numéro BL (numero_bl)
     * - Numéro conteneur (numero_conteneur ↔ conteneur_ordres.numero)
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
        // Sans filtre statut = retourner tout

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
                'armateur_id' => null,
                'transitaire_id' => null,
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
     * Le compteur "en_attente" exclut les conteneurs déjà dans un OT
     */
    public function stats(): JsonResponse
    {
        // Sous-requête pour exclure les conteneurs déjà facturés via OT
        $enAttenteReels = ConteneurTraite::where('statut', 'en_attente')
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('ordres_travail as ot')
                    ->join('conteneurs_ordres as co', 'co.ordre_id', '=', 'ot.id')
                    ->join('clients as c', 'c.id', '=', 'ot.client_id')
                    ->whereColumn('co.numero', 'conteneurs_traites.numero_conteneur')
                    ->where(function ($blQ) {
                        $blQ->whereColumn('ot.numero_bl', 'conteneurs_traites.numero_bl')
                            ->orWhere(function ($nullQ) {
                                $nullQ->whereNull('ot.numero_bl')
                                      ->whereNull('conteneurs_traites.numero_bl');
                            });
                    })
                    ->whereRaw('UPPER(TRIM(c.nom)) = UPPER(TRIM(conteneurs_traites.client_nom))');
            })
            ->count();

        $stats = [
            'total' => ConteneurTraite::count(),
            'en_attente' => $enAttenteReels,
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
