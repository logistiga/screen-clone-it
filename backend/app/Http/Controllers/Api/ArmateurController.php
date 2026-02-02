<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ArmateurController extends Controller
{
    /**
     * Liste des armateurs depuis la base OPS (lecture seule)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Lecture depuis la base OPS
            $query = DB::connection('ops')
                ->table('armateurs')
                ->select([
                    'id',
                    'nom',
                    'code',
                    'email',
                    'telephone',
                    'adresse',
                    'actif',
                    'created_at',
                    'updated_at',
                ]);

            // Filtres
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->has('actif')) {
                $query->where('actif', $request->boolean('actif') ? 1 : 0);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $armateurs = $query->orderBy('nom')->paginate($perPage);

            // Transformer les résultats pour correspondre au format attendu
            $data = collect($armateurs->items())->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nom' => $item->nom,
                    'code' => $item->code,
                    'email' => $item->email,
                    'telephone' => $item->telephone,
                    'adresse' => $item->adresse,
                    'actif' => (bool) $item->actif,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                    // Stats locales FAC (optionnel - récupérées si table locale existe)
                    'devis_count' => $this->getLocalCount('devis', 'armateur_id', $item->id),
                    'ordres_count' => $this->getLocalCount('ordres_travail', 'armateur_id', $item->id),
                    'factures_count' => $this->getLocalCount('factures', 'armateur_id', $item->id),
                    'chiffre_affaires' => $this->getLocalSum('factures', 'montant_ttc', 'armateur_id', $item->id),
                    'montant_ordres' => $this->getLocalSum('ordres_travail', 'montant_ttc', 'armateur_id', $item->id),
                    'source' => 'ops', // Indique que l'armateur vient de OPS
                ];
            });

            return response()->json([
                'data' => $data,
                'meta' => [
                    'current_page' => $armateurs->currentPage(),
                    'last_page' => $armateurs->lastPage(),
                    'per_page' => $armateurs->perPage(),
                    'total' => $armateurs->total(),
                ],
                'links' => [
                    'first' => $armateurs->url(1),
                    'last' => $armateurs->url($armateurs->lastPage()),
                    'prev' => $armateurs->previousPageUrl(),
                    'next' => $armateurs->nextPageUrl(),
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('ArmateurController@index OPS connection failed: ' . $e->getMessage());

            return response()->json([
                'message' => 'Impossible de se connecter à la base OPS. Vérifiez la configuration.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 503);
        }
    }

    /**
     * Détail d'un armateur depuis OPS
     */
    public function show(int $id): JsonResponse
    {
        try {
            $armateur = DB::connection('ops')
                ->table('armateurs')
                ->where('id', $id)
                ->first();

            if (!$armateur) {
                return response()->json(['message' => 'Armateur non trouvé'], 404);
            }

            $data = [
                'id' => $armateur->id,
                'nom' => $armateur->nom,
                'code' => $armateur->code,
                'email' => $armateur->email,
                'telephone' => $armateur->telephone,
                'adresse' => $armateur->adresse,
                'actif' => (bool) $armateur->actif,
                'created_at' => $armateur->created_at,
                'updated_at' => $armateur->updated_at,
                // Stats locales FAC
                'devis_count' => $this->getLocalCount('devis', 'armateur_id', $armateur->id),
                'ordres_count' => $this->getLocalCount('ordres_travail', 'armateur_id', $armateur->id),
                'factures_count' => $this->getLocalCount('factures', 'armateur_id', $armateur->id),
                'chiffre_affaires' => $this->getLocalSum('factures', 'montant_ttc', 'armateur_id', $armateur->id),
                'montant_ordres' => $this->getLocalSum('ordres_travail', 'montant_ttc', 'armateur_id', $armateur->id),
                'source' => 'ops',
                // Documents liés depuis FAC
                'devis' => $this->getLocalDocuments('devis', 'armateur_id', $armateur->id),
                'ordres' => $this->getLocalDocuments('ordres_travail', 'armateur_id', $armateur->id),
                'factures' => $this->getLocalDocuments('factures', 'armateur_id', $armateur->id),
            ];

            return response()->json(['data' => $data]);

        } catch (\Exception $e) {
            \Log::error('ArmateurController@show OPS connection failed: ' . $e->getMessage());

            return response()->json([
                'message' => 'Impossible de se connecter à la base OPS.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 503);
        }
    }

    /**
     * Création désactivée - les armateurs sont gérés depuis OPS
     */
    public function store(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Les armateurs sont gérés depuis l\'application OPS. Création non autorisée ici.'
        ], 403);
    }

    /**
     * Modification désactivée - les armateurs sont gérés depuis OPS
     */
    public function update(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Les armateurs sont gérés depuis l\'application OPS. Modification non autorisée ici.'
        ], 403);
    }

    /**
     * Suppression désactivée - les armateurs sont gérés depuis OPS
     */
    public function destroy(int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Les armateurs sont gérés depuis l\'application OPS. Suppression non autorisée ici.'
        ], 403);
    }

    /**
     * Statistiques d'un armateur spécifique (depuis données FAC locales)
     */
    public function stats(int $id): JsonResponse
    {
        try {
            // Vérifier que l'armateur existe dans OPS
            $armateur = DB::connection('ops')
                ->table('armateurs')
                ->where('id', $id)
                ->first();

            if (!$armateur) {
                return response()->json(['message' => 'Armateur non trouvé'], 404);
            }

            // Stats depuis FAC locale
            $stats = [
                'total_devis' => $this->getLocalCount('devis', 'armateur_id', $id),
                'total_ordres' => $this->getLocalCount('ordres_travail', 'armateur_id', $id),
                'total_factures' => $this->getLocalCount('factures', 'armateur_id', $id),
                'chiffre_affaires' => $this->getLocalSum('factures', 'montant_ttc', 'armateur_id', $id, ['annulee', 'Annulée']),
                'montant_ordres' => $this->getLocalSum('ordres_travail', 'montant_ttc', 'armateur_id', $id),
                'factures_par_statut' => $this->getLocalCountByStatus('factures', 'armateur_id', $id),
                'ordres_par_statut' => $this->getLocalCountByStatus('ordres_travail', 'armateur_id', $id),
            ];

            return response()->json($stats);

        } catch (\Exception $e) {
            \Log::error('ArmateurController@stats error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Statistiques globales de tous les armateurs
     */
    public function globalStats(Request $request): JsonResponse
    {
        try {
            $dateDebut = $request->get('date_debut');
            $dateFin = $request->get('date_fin');

            // Compter les armateurs depuis OPS
            $totalArmateurs = DB::connection('ops')->table('armateurs')->count();
            $armateursActifs = DB::connection('ops')->table('armateurs')->where('actif', 1)->count();

            // Stats factures depuis FAC locale
            $facturesQuery = DB::table('factures')
                ->whereNotNull('armateur_id')
                ->whereNotIn('statut', ['annulee', 'Annulée']);

            if ($dateDebut) {
                $facturesQuery->whereDate('date', '>=', $dateDebut);
            }
            if ($dateFin) {
                $facturesQuery->whereDate('date', '<=', $dateFin);
            }

            $chiffreAffairesTotal = (clone $facturesQuery)->sum('montant_ttc');
            $totalFactures = (clone $facturesQuery)->count();

            // Stats ordres depuis FAC locale
            $ordresQuery = DB::table('ordres_travail')->whereNotNull('armateur_id');
            if ($dateDebut) {
                $ordresQuery->whereDate('date_creation', '>=', $dateDebut);
            }
            if ($dateFin) {
                $ordresQuery->whereDate('date_creation', '<=', $dateFin);
            }
            $totalOrdres = $ordresQuery->count();
            $montantOrdres = $ordresQuery->sum('montant_ttc');

            // Top 5 armateurs par CA (jointure hybride - IDs OPS, stats FAC)
            $topArmateurs = DB::table('factures')
                ->select('armateur_id')
                ->selectRaw('SUM(montant_ttc) as total_ca')
                ->selectRaw('COUNT(id) as nb_factures')
                ->whereNotNull('armateur_id')
                ->whereNotIn('statut', ['annulee', 'Annulée'])
                ->groupBy('armateur_id')
                ->orderByDesc('total_ca')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    // Récupérer infos armateur depuis OPS
                    $armateur = DB::connection('ops')
                        ->table('armateurs')
                        ->where('id', $item->armateur_id)
                        ->first();

                    return [
                        'id' => $item->armateur_id,
                        'nom' => $armateur?->nom ?? 'Inconnu',
                        'code' => $armateur?->code ?? '',
                        'actif' => (bool) ($armateur?->actif ?? false),
                        'total_ca' => round($item->total_ca, 2),
                        'nb_factures' => $item->nb_factures,
                    ];
                });

            // Évolution mensuelle
            $evolutionMensuelle = [];
            for ($i = 11; $i >= 0; $i--) {
                $mois = now()->subMonths($i);

                $caMonth = DB::table('factures')
                    ->whereNotNull('armateur_id')
                    ->whereNotIn('statut', ['annulee', 'Annulée'])
                    ->whereYear('date', $mois->year)
                    ->whereMonth('date', $mois->month)
                    ->sum('montant_ttc');

                $ordresMonth = DB::table('ordres_travail')
                    ->whereNotNull('armateur_id')
                    ->whereYear('date_creation', $mois->year)
                    ->whereMonth('date_creation', $mois->month)
                    ->count();

                $evolutionMensuelle[] = [
                    'mois' => $mois->format('Y-m'),
                    'label' => $mois->translatedFormat('M Y'),
                    'chiffre_affaires' => round($caMonth, 2),
                    'nb_ordres' => $ordresMonth,
                ];
            }

            return response()->json([
                'totaux' => [
                    'total_armateurs' => $totalArmateurs,
                    'actifs' => $armateursActifs,
                    'inactifs' => $totalArmateurs - $armateursActifs,
                    'total_factures' => $totalFactures,
                    'total_ordres' => $totalOrdres,
                ],
                'financier' => [
                    'chiffre_affaires' => round($chiffreAffairesTotal, 2),
                    'montant_ordres' => round($montantOrdres, 2),
                ],
                'top_armateurs' => $topArmateurs,
                'evolution_mensuelle' => $evolutionMensuelle,
            ]);

        } catch (\Exception $e) {
            \Log::error('ArmateurController@globalStats error: ' . $e->getMessage());

            return response()->json([
                'message' => 'Erreur lors du calcul des statistiques globales.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // ==================== Helpers pour données locales FAC ====================

    /**
     * Compte les enregistrements dans une table FAC locale
     */
    private function getLocalCount(string $table, string $foreignKey, int $id): int
    {
        try {
            return DB::table($table)->where($foreignKey, $id)->count();
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Somme une colonne dans une table FAC locale
     */
    private function getLocalSum(string $table, string $column, string $foreignKey, int $id, array $excludeStatuts = []): float
    {
        try {
            $query = DB::table($table)->where($foreignKey, $id);

            if (!empty($excludeStatuts)) {
                $query->whereNotIn('statut', $excludeStatuts);
            }

            return round($query->sum($column) ?? 0, 2);
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Récupère les documents liés depuis FAC locale (limité à 50)
     */
    private function getLocalDocuments(string $table, string $foreignKey, int $id): array
    {
        try {
            return DB::table($table)
                ->where($foreignKey, $id)
                ->orderByDesc('created_at')
                ->limit(50)
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Compte par statut dans une table FAC locale
     */
    private function getLocalCountByStatus(string $table, string $foreignKey, int $id): array
    {
        try {
            $counts = DB::table($table)
                ->select('statut', DB::raw('COUNT(*) as count'))
                ->where($foreignKey, $id)
                ->groupBy('statut')
                ->pluck('count', 'statut')
                ->toArray();

            if ($table === 'factures') {
                return [
                    'brouillon' => $counts['Brouillon'] ?? 0,
                    'emise' => ($counts['Emise'] ?? 0) + ($counts['Envoyée'] ?? 0),
                    'payee' => ($counts['Payée'] ?? 0) + ($counts['payee'] ?? 0),
                    'partielle' => ($counts['Partielle'] ?? 0) + ($counts['Partiellement payée'] ?? 0),
                    'annulee' => ($counts['Annulée'] ?? 0) + ($counts['annulee'] ?? 0),
                ];
            }

            if ($table === 'ordres_travail') {
                return [
                    'en_cours' => $counts['En cours'] ?? 0,
                    'termine' => $counts['Terminé'] ?? 0,
                    'facture' => $counts['Facturé'] ?? 0,
                    'annule' => $counts['Annulé'] ?? 0,
                ];
            }

            return $counts;
        } catch (\Exception $e) {
            return [];
        }
    }
}
