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
        $query = Armateur::query();

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
        Audit::log('delete', 'armateur', "Armateur supprimé: {$armateur->nom}", $armateur);

        $armateur->delete();

        return response()->json(['message' => 'Armateur supprimé avec succès']);
    }
}
