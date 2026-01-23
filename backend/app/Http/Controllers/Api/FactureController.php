<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFactureRequest;
use App\Http\Requests\UpdateFactureRequest;
use App\Http\Requests\AnnulerFactureRequest;
use App\Http\Resources\FactureResource;
use App\Http\Traits\SecureQueryParameters;
use App\Models\Facture;
use App\Models\Annulation;
use App\Models\Audit;
use App\Services\Facture\FactureServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FactureController extends Controller
{
    use SecureQueryParameters;

    protected FactureServiceFactory $factureFactory;

    /**
     * Colonnes autorisées pour le tri
     */
    protected array $allowedSortColumns = [
        'id', 'numero', 'date_creation', 'date_echeance', 'montant_ht', 'montant_ttc', 
        'statut', 'categorie', 'created_at', 'updated_at'
    ];

    /**
     * Statuts autorisés pour le filtre
     */
    protected array $allowedStatuts = [
        'brouillon', 'envoyee', 'payee', 'partiellement_payee', 'annulee',
        'Brouillon', 'Envoyée', 'Payée', 'Partiellement payée', 'Annulée'
    ];

    public function __construct(FactureServiceFactory $factureFactory)
    {
        $this->factureFactory = $factureFactory;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Facture::with(['client', 'transitaire', 'ordreTravail', 'lignes', 'conteneurs.operations', 'lots', 'paiements']);

        // Recherche sécurisée
        $search = $this->validateSearchParameter($request);
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhere('numero_bl', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"))
                  ->orWhereHas('conteneurs', fn($q) => $q->where('numero', 'like', "%{$search}%"));
            });
        }

        // Filtres validés
        if ($request->filled('statut') && in_array($request->get('statut'), $this->allowedStatuts)) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->filled('categorie') && in_array($request->get('categorie'), ['Conteneur', 'Lot', 'Independant'])) {
            $query->where('categorie', $request->get('categorie'));
        }

        // Client ID validé
        $clientId = $this->validateId($request->get('client_id'));
        if ($clientId) {
            $query->where('client_id', $clientId);
        }

        // Dates validées
        $dateRange = $this->validateDateRange($request);
        if ($dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('date_creation', [$dateRange['start'], $dateRange['end']]);
        }

        if ($request->boolean('impayees')) {
            $query->whereIn('statut', ['Envoyée', 'Partiellement payée']);
        }

        // Tri et pagination sécurisés
        $sort = $this->validateSortParameters($request, $this->allowedSortColumns);
        $pagination = $this->validatePaginationParameters($request);

        $factures = $query->orderBy($sort['column'], $sort['direction'])
            ->paginate($pagination['per_page']);

        return response()->json(FactureResource::collection($factures)->response()->getData(true));
    }

    public function store(StoreFactureRequest $request): JsonResponse
    {
        try {
            $facture = $this->factureFactory->creer($request->validated());

            Audit::log('create', 'facture', "Facture créée: {$facture->numero}", $facture->id);

            return response()->json(new FactureResource($facture), 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Facture $facture): JsonResponse
    {
        $facture->load([
            'client', 'transitaire', 'representant', 'armateur', 'ordreTravail', 'lignes',
            'conteneurs.operations', 'lots', 'paiements', 'primes', 'createdBy'
        ]);

        return response()->json(new FactureResource($facture));
    }

    public function update(UpdateFactureRequest $request, Facture $facture): JsonResponse
    {
        if (in_array($facture->statut, ['payee', 'annulee'])) {
            return response()->json(['message' => 'Impossible de modifier cette facture'], 422);
        }

        try {
            $facture = $this->factureFactory->modifier($facture, $request->validated());

            Audit::log('update', 'facture', "Facture modifiée: {$facture->numero}", $facture->id);

            return response()->json(new FactureResource($facture));

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Facture $facture): JsonResponse
    {
        if ($facture->paiements()->count() > 0) {
            return response()->json(['message' => 'Impossible de supprimer une facture avec des paiements'], 422);
        }

        Audit::log('delete', 'facture', "Facture supprimée: {$facture->numero}", $facture->id);

        $facture->conteneurs()->each(fn($c) => $c->operations()->delete());
        $facture->conteneurs()->delete();
        $facture->lignes()->delete();
        $facture->lots()->delete();
        $facture->delete();

        return response()->json(['message' => 'Facture supprimée avec succès']);
    }

    public function annuler(AnnulerFactureRequest $request, Facture $facture): JsonResponse
    {
        if ($facture->statut === 'Annulée') {
            return response()->json(['message' => 'Cette facture est déjà annulée'], 422);
        }

        try {
            DB::beginTransaction();

            Annulation::create([
                'facture_id' => $facture->id,
                'motif' => $request->motif,
                'user_id' => auth()->id(),
                'date_annulation' => now(),
            ]);

            $facture->update(['statut' => 'Annulée']);

            Audit::log('cancel', 'facture', "Facture annulée: {$facture->numero}", $facture->id);

            DB::commit();

            return response()->json(['message' => 'Facture annulée avec succès']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'annulation', 'error' => $e->getMessage()], 500);
        }
    }

    public function duplicate(Facture $facture): JsonResponse
    {
        try {
            $newFacture = $this->factureFactory->dupliquer($facture);

            Audit::log('duplicate', 'facture', "Facture dupliquée: {$facture->numero} -> {$newFacture->numero}", $newFacture->id);

            return response()->json(new FactureResource($newFacture), 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la duplication', 'error' => $e->getMessage()], 500);
        }
    }

    public function impayes(Request $request): JsonResponse
    {
        $query = Facture::with(['client', 'paiements'])
            ->whereIn('statut', ['Envoyée', 'Partiellement payée']);

        if ($request->has('client_id')) {
            $query->where('client_id', $request->get('client_id'));
        }

        $factures = $query->orderBy('date_echeance', 'asc')->get();

        return response()->json(FactureResource::collection($factures));
    }
}
