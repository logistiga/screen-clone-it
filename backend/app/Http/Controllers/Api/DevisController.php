<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDevisRequest;
use App\Http\Requests\UpdateDevisRequest;
use App\Http\Resources\DevisResource;
use App\Models\Devis;
use App\Models\Audit;
use App\Services\Devis\DevisServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * CRUD Devis - délègue toute la logique métier à DevisServiceFactory.
 * Conversion et duplication restent déléguées à DevisConversionController.
 */
class DevisController extends Controller
{
    public function __construct(protected DevisServiceFactory $devisFactory) {}

    private const RELATIONS = ['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots'];

    private const TRACKED_FIELDS = [
        'montant_ht', 'montant_ttc', 'montant_tva', 'montant_css',
        'remise_type', 'remise_valeur', 'remise_montant',
        'statut', 'date_validite', 'navire', 'voyage', 'port_origine', 'port_destination',
        'notes', 'observations', 'type_operation', 'client_id', 'transitaire_id', 'armateur_id',
    ];

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Devis::lite()
                ->search($request->get('search'))
                ->statut($request->get('statut'))
                ->client($request->get('client_id'))
                ->dateRange($request->get('date_debut'), $request->get('date_fin'));

            $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
            $devis = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json(DevisResource::collection($devis)->response()->getData(true));
        } catch (\Throwable $e) {
            Log::error('Erreur listing devis', ['exception' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du chargement des devis',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function store(StoreDevisRequest $request): JsonResponse
    {
        try {
            $devis = $this->devisFactory->creer($request->validated());

            Audit::log('create', 'devis', "Devis créé: {$devis->numero}", $devis->id);

            return response()->json(new DevisResource($devis), 201);
        } catch (\Throwable $e) {
            Log::error('Erreur création devis', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la création du devis',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function show(Devis $devis): JsonResponse
    {
        try {
            $devis->loadMissing([...self::RELATIONS, 'ordre', 'annulation']);
            return response()->json(new DevisResource($devis));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors du chargement du devis',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(UpdateDevisRequest $request, Devis $devis): JsonResponse
    {
        if (in_array(strtolower($devis->statut), ['converti', 'accepte'])) {
            return response()->json([
                'message' => 'Impossible de modifier un devis converti ou accepté',
            ], 422);
        }

        try {
            $oldValues = $devis->only(self::TRACKED_FIELDS);

            $devis = $this->devisFactory->modifier($devis, $request->validated());

            $newValues = $devis->only(self::TRACKED_FIELDS);
            Audit::log('update', 'devis', "Devis modifié: {$devis->numero}", $devis, $oldValues, $newValues);

            return response()->json(new DevisResource($devis));
        } catch (\Throwable $e) {
            Log::error('Erreur mise à jour devis', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function destroy(Devis $devis): JsonResponse
    {
        if (strtolower($devis->statut) === 'converti') {
            return response()->json(['message' => 'Impossible de supprimer un devis converti'], 422);
        }

        $numero = $devis->numero;
        try {
            DB::transaction(function () use ($devis) {
                $devis->conteneurs()->each(fn($c) => $c->operations()->delete());
                $devis->conteneurs()->delete();
                $devis->lignes()->delete();
                $devis->lots()->delete();
                $devis->delete();
            });

            try {
                Audit::log('delete', 'devis', "Devis supprimé: {$numero}", $devis);
            } catch (\Throwable $e) {
                // best effort
            }

            return response()->json(['message' => 'Devis supprimé avec succès']);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    // === Délégation conversion ===
    public function convertToOrdre(Devis $devis): JsonResponse
    {
        return app(DevisConversionController::class)->convertToOrdre($devis);
    }

    public function convertToFacture(Devis $devis): JsonResponse
    {
        return app(DevisConversionController::class)->convertToFacture($devis);
    }

    public function duplicate(Devis $devis): JsonResponse
    {
        return app(DevisConversionController::class)->duplicate($devis);
    }
}
