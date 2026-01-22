<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrdreTravailRequest;
use App\Http\Requests\UpdateOrdreTravailRequest;
use App\Http\Resources\OrdreTravailResource;
use App\Http\Resources\FactureResource;
use App\Http\Traits\SecureQueryParameters;
use App\Models\OrdreTravail;
use App\Models\Audit;
use App\Services\OrdreTravail\OrdreServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrdreTravailController extends Controller
{
    use SecureQueryParameters;

    protected OrdreServiceFactory $ordreFactory;

    /**
     * Colonnes autorisées pour le tri
     */
    protected array $allowedSortColumns = [
        'id', 'numero', 'date_creation', 'montant_ht', 'montant_ttc', 
        'statut', 'categorie', 'created_at', 'updated_at'
    ];

    /**
     * Statuts autorisés
     */
    protected array $allowedStatuts = [
        'brouillon', 'en_cours', 'termine', 'facture', 'annule',
        'Brouillon', 'En cours', 'Terminé', 'Facturé', 'Annulé'
    ];

    public function __construct(OrdreServiceFactory $ordreFactory)
    {
        $this->ordreFactory = $ordreFactory;
    }

    public function index(Request $request): JsonResponse
    {
        $query = OrdreTravail::with(['client:id,nom,email,telephone', 'facture:id,numero,ordre_id']);

        // Recherche sécurisée
        $search = $this->validateSearchParameter($request);
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhere('numero_bl', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }

        // Filtres validés
        if ($request->filled('statut') && in_array($request->get('statut'), $this->allowedStatuts)) {
            $query->where('statut', $request->get('statut'));
        }

        // Client ID validé
        $clientId = $this->validateId($request->get('client_id'));
        if ($clientId) {
            $query->where('client_id', $clientId);
        }

        if ($request->filled('categorie') && in_array($request->get('categorie'), ['Conteneur', 'Lot', 'Independant'])) {
            $query->where('categorie', $request->get('categorie'));
        }

        // Dates validées
        $dateRange = $this->validateDateRange($request);
        if ($dateRange['start'] && $dateRange['end']) {
            $query->whereBetween('date_creation', [$dateRange['start'], $dateRange['end']]);
        }

        // Tri et pagination sécurisés
        $sort = $this->validateSortParameters($request, $this->allowedSortColumns);
        $pagination = $this->validatePaginationParameters($request);

        $ordres = $query->orderBy($sort['column'], $sort['direction'])
            ->paginate($pagination['per_page']);

        return response()->json(OrdreTravailResource::collection($ordres)->response()->getData(true));
    }

    /**
     * Statistiques globales des ordres (avec mêmes filtres que index)
     */
    public function stats(Request $request): JsonResponse
    {
        $query = OrdreTravail::query();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhere('numero_bl', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->get('client_id'));
        }

        if ($request->has('categorie')) {
            $query->where('categorie', $request->get('categorie'));
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date_creation', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $stats = [
            'total_ordres' => (clone $query)->count(),
            'montant_total' => (clone $query)->sum('montant_ttc'),
            'total_paye' => (clone $query)->sum('montant_paye'),
            'reste_a_payer' => (clone $query)->selectRaw('SUM(montant_ttc - COALESCE(montant_paye, 0)) as reste')->value('reste') ?? 0,
            'en_cours' => (clone $query)->where('statut', 'en_cours')->count(),
            'termine' => (clone $query)->where('statut', 'termine')->count(),
            'facture' => (clone $query)->where('statut', 'facture')->count(),
            'annule' => (clone $query)->where('statut', 'annule')->count(),
            'par_categorie' => [
                'conteneurs' => (clone $query)->where('categorie', 'conteneurs')->count(),
                'conventionnel' => (clone $query)->where('categorie', 'conventionnel')->count(),
                'operations_independantes' => (clone $query)->where('categorie', 'operations_independantes')->count(),
            ],
        ];

        return response()->json($stats);
    }

    public function store(StoreOrdreTravailRequest $request): JsonResponse
    {
        try {
            $ordre = $this->ordreFactory->creer($request->validated());

            Audit::log('create', 'ordre', "Ordre créé: {$ordre->numero}", $ordre->id);

            return response()->json(new OrdreTravailResource($ordre), 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(OrdreTravail $ordreTravail): JsonResponse
    {
        try {
            $ordreTravail->load([
                'client',
                'transitaire',
                'armateur',
                'representant',
                'devis',
                'lignes',
                'conteneurs.operations',
                'lots',
                'facture',
                'primes.paiements',
                'primes.transitaire',
                'primes.representant',
                'createdBy',
            ]);

            return response()->json(new OrdreTravailResource($ordreTravail));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => "Erreur lors du chargement de l'ordre",
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(UpdateOrdreTravailRequest $request, OrdreTravail $ordreTravail): JsonResponse
    {
        // Permettre la modification même si facturé - la facture sera synchronisée automatiquement
        try {
            $ordreTravail = $this->ordreFactory->modifier($ordreTravail, $request->validated());

            Audit::log('update', 'ordre', "Ordre modifié: {$ordreTravail->numero}", $ordreTravail->id);

            return response()->json(new OrdreTravailResource($ordreTravail));

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(OrdreTravail $ordreTravail): JsonResponse
    {
        if ($ordreTravail->statut === 'facture') {
            return response()->json(['message' => 'Impossible de supprimer un ordre facturé'], 422);
        }

        Audit::log('delete', 'ordre', "Ordre supprimé: {$ordreTravail->numero}", $ordreTravail->id);

        $ordreTravail->conteneurs()->each(fn($c) => $c->operations()->delete());
        $ordreTravail->conteneurs()->delete();
        $ordreTravail->lignes()->delete();
        $ordreTravail->lots()->delete();
        $ordreTravail->delete();

        return response()->json(['message' => 'Ordre de travail supprimé avec succès']);
    }

    public function convertToFacture(OrdreTravail $ordreTravail): JsonResponse
    {
        if ($ordreTravail->statut === 'facture') {
            return response()->json(['message' => 'Cet ordre a déjà été facturé'], 422);
        }

        try {
            $facture = $this->ordreFactory->convertirEnFacture($ordreTravail);

            Audit::log('convert', 'ordre', "Ordre converti en facture: {$ordreTravail->numero} -> {$facture->numero}", $ordreTravail->id);

            return response()->json([
                'message' => 'Ordre converti en facture',
                'facture' => new FactureResource($facture)
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la conversion', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Vérifier si un numéro de conteneur existe déjà dans la base de données
     */
    public function checkConteneur(Request $request): JsonResponse
    {
        $numero = $this->validateSearchParameter($request, 'numero');
        
        if (!$numero || strlen($numero) < 4) {
            return response()->json([
                'exists' => false,
                'message' => 'Numéro de conteneur invalide ou trop court',
            ]);
        }

        // Rechercher le conteneur dans les ordres de travail (case-insensitive)
        $numeroUpper = strtoupper(trim($numero));
        $conteneur = \App\Models\ConteneurOrdre::whereRaw('UPPER(numero) = ?', [$numeroUpper])
            ->with(['ordre:id,numero,date_creation,client_id', 'ordre.client:id,nom'])
            ->orderBy('created_at', 'desc')
            ->first();

        if ($conteneur) {
            return response()->json([
                'exists' => true,
                'message' => 'Ce conteneur existe déjà',
                'details' => [
                    'ordre_numero' => $conteneur->ordre?->numero,
                    'ordre_date' => $conteneur->ordre?->date_creation?->format('d/m/Y'),
                    'client' => $conteneur->ordre?->client?->nom,
                ],
            ]);
        }

        return response()->json([
            'exists' => false,
            'message' => 'Conteneur non trouvé',
        ]);
    }
}
