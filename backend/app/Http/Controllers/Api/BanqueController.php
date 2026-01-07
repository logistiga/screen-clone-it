<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBanqueRequest;
use App\Http\Requests\UpdateBanqueRequest;
use App\Http\Resources\BanqueResource;
use App\Models\Banque;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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

        return response()->json(BanqueResource::collection($banques));
    }

    public function store(StoreBanqueRequest $request): JsonResponse
    {
        $banque = Banque::create($request->validated());

        Audit::log('create', 'banque', "Banque créée: {$banque->nom}", $banque->id);

        return response()->json(new BanqueResource($banque), 201);
    }

    public function show(Banque $banque): JsonResponse
    {
        $banque->load(['paiements' => fn($q) => $q->orderBy('date_paiement', 'desc')->limit(20)]);
        
        return response()->json(new BanqueResource($banque));
    }

    public function update(UpdateBanqueRequest $request, Banque $banque): JsonResponse
    {
        $banque->update($request->validated());

        Audit::log('update', 'banque', "Banque modifiée: {$banque->nom}", $banque->id);

        return response()->json(new BanqueResource($banque));
    }

    public function destroy(Banque $banque): JsonResponse
    {
        if ($banque->paiements()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer cette banque car elle a des paiements associés'
            ], 422);
        }

        Audit::log('delete', 'banque', "Banque supprimée: {$banque->nom}", $banque->id);

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
