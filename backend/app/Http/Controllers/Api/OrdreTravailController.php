<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrdreTravailRequest;
use App\Http\Requests\UpdateOrdreTravailRequest;
use App\Http\Resources\OrdreTravailResource;
use App\Http\Resources\FactureResource;
use App\Models\OrdreTravail;
use App\Models\Audit;
use App\Services\OrdreTravail\OrdreServiceFactory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrdreTravailController extends Controller
{
    protected OrdreServiceFactory $ordreFactory;

    public function __construct(OrdreServiceFactory $ordreFactory)
    {
        $this->ordreFactory = $ordreFactory;
    }

    public function index(Request $request): JsonResponse
    {
        $query = OrdreTravail::with(['client', 'transitaire', 'devis', 'lignes', 'conteneurs.operations', 'lots']);

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
            $query->whereBetween('date', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $ordres = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(OrdreTravailResource::collection($ordres)->response()->getData(true));
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
        $ordreTravail->load(['client', 'transitaire', 'devis', 'lignes', 'conteneurs.operations', 'conteneurs.armateur', 'lots', 'facture']);
        return response()->json(new OrdreTravailResource($ordreTravail));
    }

    public function update(UpdateOrdreTravailRequest $request, OrdreTravail $ordreTravail): JsonResponse
    {
        if ($ordreTravail->statut === 'facture') {
            return response()->json(['message' => 'Impossible de modifier un ordre facturé'], 422);
        }

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
}
