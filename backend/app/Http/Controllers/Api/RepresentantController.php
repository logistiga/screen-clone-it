<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRepresentantRequest;
use App\Http\Requests\UpdateRepresentantRequest;
use App\Http\Resources\RepresentantResource;
use App\Http\Resources\PrimeResource;
use App\Models\Representant;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RepresentantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Representant::withCount('primes')
            ->withSum('primes', 'montant')
            ->with(['primes' => fn($q) => $q->select('id', 'representant_id', 'montant', 'statut')]);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        $representants = $query->orderBy('nom')->paginate($request->get('per_page', 15));

        return response()->json(RepresentantResource::collection($representants)->response()->getData(true));
    }

    public function store(StoreRepresentantRequest $request): JsonResponse
    {
        $representant = Representant::create($request->validated());

        Audit::log('create', 'representant', "Représentant créé: {$representant->nom} {$representant->prenom}", $representant);

        return response()->json(['data' => new RepresentantResource($representant)], 201);
    }

    public function show(Representant $representant): JsonResponse
    {
        $representant->load([
            'primes' => fn($q) => $q->orderBy('created_at', 'desc'),
            'primes.paiements',
        ]);

        return response()->json(['data' => new RepresentantResource($representant)]);
    }

    public function update(UpdateRepresentantRequest $request, Representant $representant): JsonResponse
    {
        $representant->update($request->validated());

        Audit::log('update', 'representant', "Représentant modifié: {$representant->nom} {$representant->prenom}", $representant);

        return response()->json(['data' => new RepresentantResource($representant)]);
    }

    public function destroy(Representant $representant): JsonResponse
    {
        if ($representant->primes()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce représentant car il a des primes associées'
            ], 422);
        }

        Audit::log('delete', 'representant', "Représentant supprimé: {$representant->nom} {$representant->prenom}", $representant);

        $representant->delete();

        return response()->json(['message' => 'Représentant supprimé avec succès']);
    }

    public function primes(Representant $representant, Request $request): JsonResponse
    {
        $query = $representant->primes()->with(['facture', 'paiements']);

        if ($request->has('statut')) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('created_at', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $primes = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(PrimeResource::collection($primes)->response()->getData(true));
    }
}
