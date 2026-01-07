<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Armateur;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

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

        $armateurs = $query->orderBy('nom')->get();

        return response()->json($armateurs);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:armateurs,code',
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $armateur = Armateur::create($request->all());

        return response()->json($armateur, 201);
    }

    public function show(Armateur $armateur): JsonResponse
    {
        return response()->json($armateur);
    }

    public function update(Request $request, Armateur $armateur): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:50|unique:armateurs,code,' . $armateur->id,
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $armateur->update($request->all());

        return response()->json($armateur);
    }

    public function destroy(Armateur $armateur): JsonResponse
    {
        $armateur->delete();

        return response()->json(['message' => 'Armateur supprimé avec succès']);
    }
}
