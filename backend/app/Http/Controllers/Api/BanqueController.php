<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBanqueRequest;
use App\Http\Requests\UpdateBanqueRequest;
use App\Http\Resources\BanqueResource;
use App\Models\Banque;
use App\Models\Paiement;
use App\Models\MouvementCaisse;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

class BanqueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Banque::withCount('paiements')
            ->withSum('paiements', 'montant');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        $banques = $query->orderBy('nom')->get();

        return response()->json(BanqueResource::collection($banques));
    }

    public function store(StoreBanqueRequest $request): JsonResponse
    {
        $banque = Banque::create($request->validated());

        Audit::log('create', 'banque', "Banque créée: {$banque->nom}", $banque->id);

        return response()->json(new BanqueResource($banque), 201);
    }

    public function show(Banque $banque): JsonResponse
    {
        $banque->load(['paiements' => fn($q) => $q->orderBy('date_paiement', 'desc')->limit(20)]);
        
        return response()->json(new BanqueResource($banque));
    }

    public function update(UpdateBanqueRequest $request, Banque $banque): JsonResponse
    {
        $banque->update($request->validated());

        Audit::log('update', 'banque', "Banque modifiée: {$banque->nom}", $banque->id);

        return response()->json(new BanqueResource($banque));
    }

    public function destroy(Banque $banque): JsonResponse
    {
        if ($banque->paiements()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer cette banque car elle a des paiements associés'
            ], 422);
        }

        Audit::log('delete', 'banque', "Banque supprimée: {$banque->nom}", $banque->id);

        $banque->delete();

        return response()->json(['message' => 'Banque supprimée avec succès']);
    }

    public function stats(Banque $banque, Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfYear());
        $dateFin = $request->get('date_fin', now()->endOfYear());

        $stats = [
            'total_paiements' => $banque->paiements()
                ->whereBetween('date_paiement', [$dateDebut, $dateFin])
                ->sum('montant'),
            'nombre_paiements' => $banque->paiements()
                ->whereBetween('date_paiement', [$dateDebut, $dateFin])
                ->count(),
            'par_mois' => $banque->paiements()
                ->whereBetween('date_paiement', [$dateDebut, $dateFin])
                ->selectRaw('MONTH(date_paiement) as mois, YEAR(date_paiement) as annee, SUM(montant) as total')
                ->groupBy('annee', 'mois')
                ->orderBy('annee')
                ->orderBy('mois')
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Endpoint unifié pour tous les mouvements bancaires (encaissements + décaissements)
     */
    public function mouvements(Request $request): JsonResponse
    {
        // Paramètres de filtrage
        $banqueId = $request->get('banque_id');
        $type = $request->get('type'); // 'entree' | 'sortie' | null (tous)
        $dateDebut = $request->get('date_debut');
        $dateFin = $request->get('date_fin');
        $search = $request->get('search');
        $page = (int) $request->get('page', 1);
        $perPage = (int) $request->get('per_page', 20);

        // === ENCAISSEMENTS (Paiements virement/chèque) ===
        $encaissementsQuery = Paiement::with(['facture.client', 'ordre.client', 'client', 'banque'])
            ->whereIn('mode_paiement', ['Virement', 'Chèque'])
            ->when($banqueId, fn($q) => $q->where('banque_id', $banqueId))
            ->when($dateDebut, fn($q) => $q->whereDate('date', '>=', $dateDebut))
            ->when($dateFin, fn($q) => $q->whereDate('date', '<=', $dateFin))
            ->when($search, function($q) use ($search) {
                $q->where(function($sub) use ($search) {
                    $sub->where('reference', 'like', "%{$search}%")
                        ->orWhere('numero_cheque', 'like', "%{$search}%")
                        ->orWhereHas('client', fn($c) => $c->where('nom', 'like', "%{$search}%"))
                        ->orWhereHas('facture', fn($f) => $f->where('numero', 'like', "%{$search}%"))
                        ->orWhereHas('facture.client', fn($c) => $c->where('nom', 'like', "%{$search}%"))
                        ->orWhereHas('ordre', fn($o) => $o->where('numero', 'like', "%{$search}%"))
                        ->orWhereHas('ordre.client', fn($c) => $c->where('nom', 'like', "%{$search}%"));
                });
            });

        $encaissements = $encaissementsQuery->get()->map(function($p) {
            $clientNom = $p->client?->nom 
                ?? $p->facture?->client?->nom 
                ?? $p->ordre?->client?->nom;
            
            return [
                'id' => 'paiement_' . $p->id,
                'type' => 'entree',
                'date' => $p->date,
                'montant' => (float) $p->montant,
                'categorie' => $p->mode_paiement,
                'description' => $p->facture?->numero ?? $p->ordre?->numero ?? null,
                'tiers' => $clientNom,
                'banque' => $p->banque ? [
                    'id' => $p->banque->id,
                    'nom' => $p->banque->nom,
                ] : null,
                'reference' => $p->reference ?? $p->numero_cheque,
                'source_type' => 'paiement',
                'source_id' => $p->id,
                'document_type' => $p->facture_id ? 'facture' : ($p->ordre_id ? 'ordre' : null),
                'document_id' => $p->facture_id ?? $p->ordre_id,
            ];
        });

        // === DÉCAISSEMENTS (Mouvements caisse source=banque type=sortie) ===
        $decaissementsQuery = MouvementCaisse::with(['banque'])
            ->where('source', 'banque')
            ->where('type', 'sortie')
            ->when($banqueId, fn($q) => $q->where('banque_id', $banqueId))
            ->when($dateDebut, fn($q) => $q->whereDate('date', '>=', $dateDebut))
            ->when($dateFin, fn($q) => $q->whereDate('date', '<=', $dateFin))
            ->when($search, function($q) use ($search) {
                $q->where(function($sub) use ($search) {
                    $sub->where('description', 'like', "%{$search}%")
                        ->orWhere('categorie', 'like', "%{$search}%")
                        ->orWhere('beneficiaire', 'like', "%{$search}%");
                });
            });

        $decaissements = $decaissementsQuery->get()->map(function($m) {
            return [
                'id' => 'mouvement_' . $m->id,
                'type' => 'sortie',
                'date' => $m->date,
                'montant' => (float) $m->montant,
                'categorie' => $m->categorie,
                'description' => $m->description,
                'tiers' => $m->beneficiaire,
                'banque' => $m->banque ? [
                    'id' => $m->banque->id,
                    'nom' => $m->banque->nom,
                ] : null,
                'reference' => null,
                'source_type' => 'mouvement',
                'source_id' => $m->id,
                'document_type' => null,
                'document_id' => null,
            ];
        });

        // === FUSION ET TRI ===
        $allMouvements = $encaissements->concat($decaissements);

        // Filtrer par type si demandé
        if ($type === 'entree') {
            $allMouvements = $allMouvements->where('type', 'entree');
        } elseif ($type === 'sortie') {
            $allMouvements = $allMouvements->where('type', 'sortie');
        }

        // Trier par date décroissante
        $allMouvements = $allMouvements->sortByDesc('date')->values();

        // === STATISTIQUES ===
        $stats = [
            'total_encaissements' => $encaissements->sum('montant'),
            'total_decaissements' => $decaissements->sum('montant'),
            'nombre_encaissements' => $encaissements->count(),
            'nombre_decaissements' => $decaissements->count(),
            'solde_periode' => $encaissements->sum('montant') - $decaissements->sum('montant'),
        ];

        // === PAGINATION MANUELLE ===
        $total = $allMouvements->count();
        $lastPage = (int) ceil($total / $perPage);
        $paginatedItems = $allMouvements->forPage($page, $perPage)->values();

        return response()->json([
            'data' => $paginatedItems,
            'meta' => [
                'current_page' => $page,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $total,
            ],
            'stats' => $stats,
        ]);
    }
}
