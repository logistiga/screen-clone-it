<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Representant;
use App\Models\Prime;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class RepresentantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Representant::withCount('primes')
            ->withSum('primes', 'montant');

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

        return response()->json($representants);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:50',
            'adresse' => 'nullable|string',
            'taux_commission' => 'nullable|numeric|min:0|max:100',
            'actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $representant = Representant::create($request->all());

        return response()->json($representant, 201);
    }

    public function show(Representant $representant): JsonResponse
    {
        $representant->load([
            'primes' => fn($q) => $q->orderBy('created_at', 'desc'),
            'primes.paiements',
        ]);

        $representant->stats = [
            'total_primes' => $representant->primes()->sum('montant'),
            'primes_payees' => $representant->primes()
                ->whereHas('paiements')
                ->get()
                ->sum(fn($p) => $p->paiements->sum('montant')),
            'primes_en_attente' => $representant->primes()
                ->where('statut', 'En attente')
                ->sum('montant'),
        ];

        return response()->json($representant);
    }

    public function update(Request $request, Representant $representant): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'prenom' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:50',
            'adresse' => 'nullable|string',
            'taux_commission' => 'nullable|numeric|min:0|max:100',
            'actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $representant->update($request->all());

        return response()->json($representant);
    }

    public function destroy(Representant $representant): JsonResponse
    {
        if ($representant->primes()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce représentant car il a des primes associées'
            ], 422);
        }

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

        return response()->json($primes);
    }
}
