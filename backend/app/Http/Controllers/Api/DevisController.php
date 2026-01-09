<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDevisRequest;
use App\Http\Requests\UpdateDevisRequest;
use App\Http\Resources\DevisResource;
use App\Http\Resources\OrdreTravailResource;
use App\Models\Devis;
use App\Models\Audit;
use App\Services\Devis\DevisServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DevisController extends Controller
{
    protected DevisServiceFactory $devisFactory;

    public function __construct(DevisServiceFactory $devisFactory)
    {
        $this->devisFactory = $devisFactory;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Devis::with(['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->get('client_id'));
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $devis = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(DevisResource::collection($devis)->response()->getData(true));
    }

    public function store(StoreDevisRequest $request): JsonResponse
    {
        try {
            $devis = $this->devisFactory->creer($request->validated());

            Audit::log('create', 'devis', "Devis créé: {$devis->numero}", $devis->id);

            return response()->json(new DevisResource($devis), 201);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Erreur création devis', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de la création du devis',
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ], 500);
        }
    }

    public function show(Devis $devis): JsonResponse
    {
        try {
            $devis->load(['client', 'armateur', 'transitaire', 'representant', 'lignes', 'conteneurs.operations', 'lots']);
            return response()->json(new DevisResource($devis));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Erreur affichage devis', [
                'devis_id' => $devis->id ?? null,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors du chargement du devis',
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ], 500);
        }
    }

    public function update(UpdateDevisRequest $request, Devis $devis): JsonResponse
    {
        if ($devis->statut === 'Converti') {
            return response()->json(['message' => 'Impossible de modifier un devis converti'], 422);
        }

        try {
            $devis = $this->devisFactory->modifier($devis, $request->validated());

            Audit::log('update', 'devis', "Devis modifié: {$devis->numero}", $devis->id);

            return response()->json(new DevisResource($devis));

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Erreur mise à jour devis', [
                'devis_id' => $devis->id,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ], 500);
        }
    }

    public function destroy(Devis $devis): JsonResponse
    {
        if ($devis->statut === 'Converti') {
            return response()->json(['message' => 'Impossible de supprimer un devis converti'], 422);
        }

        $numero = $devis->numero;
        $devisId = $devis->id;

        try {
            // Supprimer les relations en premier
            $devis->conteneurs()->get()->each(fn($c) => $c->operations()->delete());
            $devis->conteneurs()->delete();
            $devis->lignes()->delete();
            $devis->lots()->delete();

            // Supprimer le devis
            $devis->delete();

            // Audit: ne doit jamais casser la suppression
            try {
                // Certains backends attendent un Model (pas un id). On passe donc le Model.
                Audit::log('delete', 'devis', "Devis supprimé: {$numero}", $devis);
            } catch (\Throwable $auditError) {
                \Illuminate\Support\Facades\Log::warning('Audit delete devis échoué', [
                    'devis_id' => $devisId,
                    'exception' => get_class($auditError),
                    'message' => $auditError->getMessage(),
                ]);
            }

            return response()->json(['message' => 'Devis supprimé avec succès']);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Erreur suppression devis', [
                'devis_id' => $devisId,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression du devis',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function convertToOrdre(Devis $devis): JsonResponse
    {
        if ($devis->statut === 'Converti') {
            return response()->json(['message' => 'Ce devis a déjà été converti'], 422);
        }

        try {
            $ordre = $this->devisFactory->convertirEnOrdre($devis);

            Audit::log('convert', 'devis', "Devis converti en ordre: {$devis->numero} -> {$ordre->numero}", $devis->id);

            return response()->json([
                'message' => 'Devis converti en ordre de travail',
                'ordre' => new OrdreTravailResource($ordre)
            ]);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Erreur conversion devis->ordre', [
                'devis_id' => $devis->id,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de la conversion',
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ], 500);
        }
    }

    public function duplicate(Devis $devis): JsonResponse
    {
        try {
            $newDevis = $this->devisFactory->dupliquer($devis);

            Audit::log('duplicate', 'devis', "Devis dupliqué: {$devis->numero} -> {$newDevis->numero}", $newDevis->id);

            return response()->json(new DevisResource($newDevis), 201);

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Erreur duplication devis', [
                'devis_id' => $devis->id,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de la duplication',
                'error' => $e->getMessage(),
                'exception' => get_class($e),
            ], 500);
        }
    }
}
