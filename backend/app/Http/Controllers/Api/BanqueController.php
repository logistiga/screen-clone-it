<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banque;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class BanqueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Banque::withCount('paiements')
            ->withSum('paiements', 'montant');

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

        $banques = $query->orderBy('nom')->get();

        return response()->json($banques);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:banques,code',
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'rib' => 'nullable|string|max:100',
            'iban' => 'nullable|string|max:50',
            'swift' => 'nullable|string|max:20',
            'actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $banque = Banque::create($request->all());

        return response()->json($banque, 201);
    }

    public function show(Banque $banque): JsonResponse
    {
        $banque->load(['paiements' => fn($q) => $q->orderBy('date_paiement', 'desc')->limit(20)]);
        $banque->total_paiements = $banque->paiements()->sum('montant');
        $banque->nombre_paiements = $banque->paiements()->count();

        return response()->json($banque);
    }

    public function update(Request $request, Banque $banque): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:50|unique:banques,code,' . $banque->id,
            'adresse' => 'nullable|string',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'rib' => 'nullable|string|max:100',
            'iban' => 'nullable|string|max:50',
            'swift' => 'nullable|string|max:20',
            'actif' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $banque->update($request->all());

        return response()->json($banque);
    }

    public function destroy(Banque $banque): JsonResponse
    {
        if ($banque->paiements()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer cette banque car elle a des paiements associés'
            ], 422);
        }

        $banque->delete();

        return response()->json(['message' => 'Banque supprimée avec succès']);
    }

    public function stats(Banque $banque, Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfYear());
        $dateFin = $request->get('date_fin', now()->endOfYear());

        $stats = [
            'total_paiements' => $banque->paiements()
                ->whereBetween('date_paiement', [$dateDebut, $dateFin])
                ->sum('montant'),
            'nombre_paiements' => $banque->paiements()
                ->whereBetween('date_paiement', [$dateDebut, $dateFin])
                ->count(),
            'par_mois' => $banque->paiements()
                ->whereBetween('date_paiement', [$dateDebut, $dateFin])
                ->selectRaw('MONTH(date_paiement) as mois, YEAR(date_paiement) as annee, SUM(montant) as total')
                ->groupBy('annee', 'mois')
                ->orderBy('annee')
                ->orderBy('mois')
                ->get(),
        ];

        return response()->json($stats);
    }
}
