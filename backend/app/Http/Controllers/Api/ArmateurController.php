<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArmateurRequest;
use App\Http\Requests\UpdateArmateurRequest;
use App\Http\Resources\ArmateurResource;
use App\Models\Armateur;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ArmateurController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Optimisation: calcul SQL des statistiques
        $query = Armateur::query()
            ->withCount(['devis', 'ordres', 'factures'])
            ->select('armateurs.*')
            ->selectSub(function ($q) {
                $q->from('factures')
                    ->selectRaw('COALESCE(SUM(montant_ttc), 0)')
                    ->whereColumn('factures.armateur_id', 'armateurs.id')
                    ->whereNotIn('statut', ['annulee', 'Annulée']);
            }, 'chiffre_affaires')
            ->selectSub(function ($q) {
                $q->from('ordres_travail')
                    ->selectRaw('COALESCE(SUM(montant_ttc), 0)')
                    ->whereColumn('ordres_travail.armateur_id', 'armateurs.id');
            }, 'montant_ordres');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        $armateurs = $query->orderBy('nom')->paginate($request->get('per_page', 15));

        return response()->json(ArmateurResource::collection($armateurs)->response()->getData(true));
    }

    public function store(StoreArmateurRequest $request): JsonResponse
    {
        $armateur = Armateur::create($request->validated());

        Audit::log('create', 'armateur', "Armateur créé: {$armateur->nom}", $armateur);

        return response()->json(['data' => new ArmateurResource($armateur)], 201);
    }

    public function show(Armateur $armateur): JsonResponse
    {
        $armateur->load([
            'devis' => fn($q) => $q->with('client')->orderBy('created_at', 'desc')->limit(50),
            'ordres' => fn($q) => $q->with('client')->orderBy('created_at', 'desc')->limit(50),
            'factures' => fn($q) => $q->with('client')->orderBy('created_at', 'desc')->limit(50),
        ]);

        // Calcul des stats pour le détail
        $armateur->setAttribute('chiffre_affaires', $armateur->factures->whereNotIn('statut', ['annulee', 'Annulée'])->sum('montant_ttc'));
        $armateur->setAttribute('montant_ordres', $armateur->ordres->sum('montant_ttc'));

        return response()->json(['data' => new ArmateurResource($armateur)]);
    }

    public function update(UpdateArmateurRequest $request, Armateur $armateur): JsonResponse
    {
        $armateur->update($request->validated());

        Audit::log('update', 'armateur', "Armateur modifié: {$armateur->nom}", $armateur);

        return response()->json(['data' => new ArmateurResource($armateur)]);
    }

    public function destroy(Armateur $armateur): JsonResponse
    {
        // Vérifier les factures associées
        if ($armateur->factures()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer cet armateur car il a des factures associées'
            ], 422);
        }

        Audit::log('delete', 'armateur', "Armateur supprimé: {$armateur->nom}", $armateur);

        $armateur->delete();

        return response()->json(['message' => 'Armateur supprimé avec succès']);
    }

    /**
     * Statistiques d'un armateur spécifique
     */
    public function stats(Armateur $armateur): JsonResponse
    {
        $stats = [
            'total_devis' => $armateur->devis()->count(),
            'total_ordres' => $armateur->ordres()->count(),
            'total_factures' => $armateur->factures()->count(),
            'chiffre_affaires' => round($armateur->factures()->whereNotIn('statut', ['annulee', 'Annulée'])->sum('montant_ttc'), 2),
            'montant_ordres' => round($armateur->ordres()->sum('montant_ttc'), 2),
            'factures_par_statut' => [
                'brouillon' => $armateur->factures()->where('statut', 'Brouillon')->count(),
                'emise' => $armateur->factures()->whereIn('statut', ['Emise', 'Envoyée'])->count(),
                'payee' => $armateur->factures()->whereIn('statut', ['Payée', 'payee'])->count(),
                'partielle' => $armateur->factures()->whereIn('statut', ['Partielle', 'Partiellement payée'])->count(),
                'annulee' => $armateur->factures()->whereIn('statut', ['Annulée', 'annulee'])->count(),
            ],
            'ordres_par_statut' => [
                'en_cours' => $armateur->ordres()->where('statut', 'En cours')->count(),
                'termine' => $armateur->ordres()->where('statut', 'Terminé')->count(),
                'facture' => $armateur->ordres()->where('statut', 'Facturé')->count(),
                'annule' => $armateur->ordres()->where('statut', 'Annulé')->count(),
            ],
        ];

        return response()->json($stats);
    }

    /**
     * Statistiques globales de tous les armateurs
     */
    public function globalStats(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut');
        $dateFin = $request->get('date_fin');

        // Totaux généraux
        $totalArmateurs = Armateur::count();
        $armateursActifs = Armateur::where('actif', true)->count();
        
        // Stats factures
        $facturesQuery = \App\Models\Facture::whereNotNull('armateur_id')
            ->whereNotIn('statut', ['annulee', 'Annulée']);
        
        if ($dateDebut) {
            $facturesQuery->whereDate('date', '>=', $dateDebut);
        }
        if ($dateFin) {
            $facturesQuery->whereDate('date', '<=', $dateFin);
        }

        $chiffreAffairesTotal = (clone $facturesQuery)->sum('montant_ttc');
        $totalFactures = (clone $facturesQuery)->count();

        // Stats ordres
        $ordresQuery = \App\Models\OrdreTravail::whereNotNull('armateur_id');
        if ($dateDebut) {
            $ordresQuery->whereDate('date_creation', '>=', $dateDebut);
        }
        if ($dateFin) {
            $ordresQuery->whereDate('date_creation', '<=', $dateFin);
        }
        $totalOrdres = $ordresQuery->count();
        $montantOrdres = $ordresQuery->sum('montant_ttc');

        // Top 5 armateurs par CA
        $topArmateurs = Armateur::select('armateurs.id', 'armateurs.nom', 'armateurs.code', 'armateurs.actif')
            ->join('factures', 'armateurs.id', '=', 'factures.armateur_id')
            ->whereNotIn('factures.statut', ['annulee', 'Annulée'])
            ->groupBy('armateurs.id', 'armateurs.nom', 'armateurs.code', 'armateurs.actif')
            ->selectRaw('SUM(factures.montant_ttc) as total_ca')
            ->selectRaw('COUNT(factures.id) as nb_factures')
            ->orderByDesc('total_ca')
            ->limit(5)
            ->get();

        // Évolution mensuelle (12 derniers mois)
        $evolutionMensuelle = [];
        for ($i = 11; $i >= 0; $i--) {
            $mois = now()->subMonths($i);
            
            $caMonth = \App\Models\Facture::whereNotNull('armateur_id')
                ->whereNotIn('statut', ['annulee', 'Annulée'])
                ->whereYear('date', $mois->year)
                ->whereMonth('date', $mois->month)
                ->sum('montant_ttc');

            $ordresMonth = \App\Models\OrdreTravail::whereNotNull('armateur_id')
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
    }
}
