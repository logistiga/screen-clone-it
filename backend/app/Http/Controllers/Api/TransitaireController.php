<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transitaire;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TransitaireController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transitaire::withCount(['devis', 'ordresTravail', 'factures']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        $transitaires = $query->orderBy('nom')->paginate($request->get('per_page', 15));

        return response()->json($transitaires);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:50',
            'adresse' => 'nullable|string',
            'contact_principal' => 'nullable|string|max:255',
            'nif' => 'nullable|string|max:100',
            'rccm' => 'nullable|string|max:100',
            'actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $transitaire = Transitaire::create($request->all());

        return response()->json($transitaire, 201);
    }

    public function show(Transitaire $transitaire): JsonResponse
    {
        $transitaire->load([
            'devis' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
            'ordresTravail' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
            'factures' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
        ]);

        $transitaire->stats = [
            'total_devis' => $transitaire->devis()->count(),
            'total_ordres' => $transitaire->ordresTravail()->count(),
            'total_factures' => $transitaire->factures()->count(),
            'montant_total' => $transitaire->factures()->sum('montant_ttc'),
        ];

        return response()->json($transitaire);
    }

    public function update(Request $request, Transitaire $transitaire): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:50',
            'adresse' => 'nullable|string',
            'contact_principal' => 'nullable|string|max:255',
            'nif' => 'nullable|string|max:100',
            'rccm' => 'nullable|string|max:100',
            'actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $transitaire->update($request->all());

        return response()->json($transitaire);
    }

    public function destroy(Transitaire $transitaire): JsonResponse
    {
        if ($transitaire->factures()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce transitaire car il a des factures associées'
            ], 422);
        }

        $transitaire->delete();

        return response()->json(['message' => 'Transitaire supprimé avec succès']);
    }
}
