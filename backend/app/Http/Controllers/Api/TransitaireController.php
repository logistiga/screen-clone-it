<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransitaireRequest;
use App\Http\Requests\UpdateTransitaireRequest;
use App\Http\Resources\TransitaireResource;
use App\Http\Traits\SecureQueryParameters;
use App\Models\Transitaire;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransitaireController extends Controller
{
    use SecureQueryParameters;

    /**
     * Colonnes autorisées pour le tri
     */
    protected array $allowedSortColumns = [
        'id', 'nom', 'email', 'telephone', 'actif', 'created_at', 'updated_at'
    ];

    public function index(Request $request): JsonResponse
    {
        // Optimisation: calcul SQL des primes au lieu de charger toutes les primes en mémoire
        $query = Transitaire::query()
            ->withCount(['devis', 'ordresTravail', 'factures'])
            ->select('transitaires.*')
            ->selectSub(function ($q) {
                $q->from('primes')
                    ->selectRaw('COALESCE(SUM(montant), 0)')
                    ->whereColumn('primes.transitaire_id', 'transitaires.id')
                    ->whereIn('statut', ['En attente', 'Partiellement payée']);
            }, 'primes_dues')
            ->selectSub(function ($q) {
                $q->from('primes')
                    ->selectRaw('COALESCE(SUM(montant), 0)')
                    ->whereColumn('primes.transitaire_id', 'transitaires.id')
                    ->where('statut', 'Payée');
            }, 'primes_payees');

        // Recherche sécurisée
        $search = $this->validateSearchParameter($request);
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        // Tri et pagination sécurisés
        $sort = $this->validateSortParameters($request, $this->allowedSortColumns, 'nom', 'asc');
        // Transitaires: on autorise un per_page plus élevé (liste de référence utilisée partout)
        $pagination = $this->validatePaginationParameters($request, 200, 500);

        $transitaires = $query->orderBy($sort['column'], $sort['direction'])
            ->paginate($pagination['per_page']);

        return response()->json(TransitaireResource::collection($transitaires)->response()->getData(true));
    }

    public function store(StoreTransitaireRequest $request): JsonResponse
    {
        $transitaire = Transitaire::create($request->validated());

        Audit::log('create', 'transitaire', "Transitaire créé: {$transitaire->nom}", $transitaire);

        return response()->json(['data' => new TransitaireResource($transitaire)], 201);
    }

    public function show(Transitaire $transitaire): JsonResponse
    {
        $transitaire->load([
            'devis' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
            'ordresTravail' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
            'factures' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
            'primes' => fn($q) => $q->orderBy('created_at', 'desc'),
            'primes.paiements',
            'primes.ordre',
            'primes.facture',
            'paiementsPrimes' => fn($q) => $q->orderBy('date', 'desc'),
            'paiementsPrimes.primes',
            'paiementsPrimes.primes.ordre',
            'paiementsPrimes.primes.facture',
        ]);

        return response()->json(['data' => new TransitaireResource($transitaire)]);
    }

    public function update(UpdateTransitaireRequest $request, Transitaire $transitaire): JsonResponse
    {
        $transitaire->update($request->validated());

        Audit::log('update', 'transitaire', "Transitaire modifié: {$transitaire->nom}", $transitaire);

        return response()->json(['data' => new TransitaireResource($transitaire)]);
    }

    public function destroy(Transitaire $transitaire): JsonResponse
    {
        if ($transitaire->factures()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce transitaire car il a des factures associées'
            ], 422);
        }

        Audit::log('delete', 'transitaire', "Transitaire supprimé: {$transitaire->nom}", $transitaire);

        $transitaire->delete();

        return response()->json(['message' => 'Transitaire supprimé avec succès']);
    }
}
