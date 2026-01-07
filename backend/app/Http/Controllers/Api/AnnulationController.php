<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Annulation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnnulationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Annulation::with(['facture.client', 'user']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('motif', 'like', "%{$search}%")
                  ->orWhereHas('facture', fn($q) => $q->where('numero', 'like', "%{$search}%"));
            });
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date_annulation', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $annulations = $query->orderBy('date_annulation', 'desc')->paginate($request->get('per_page', 15));

        return response()->json($annulations);
    }

    public function show(Annulation $annulation): JsonResponse
    {
        $annulation->load(['facture.client', 'facture.lignes', 'facture.conteneurs', 'facture.lots', 'user']);
        return response()->json($annulation);
    }

    public function stats(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfYear());
        $dateFin = $request->get('date_fin', now()->endOfYear());

        $stats = [
            'total' => Annulation::whereBetween('date_annulation', [$dateDebut, $dateFin])->count(),
            'montant_total' => Annulation::whereBetween('date_annulation', [$dateDebut, $dateFin])
                ->join('factures', 'annulations.facture_id', '=', 'factures.id')
                ->sum('factures.montant_ttc'),
            'par_mois' => Annulation::whereBetween('date_annulation', [$dateDebut, $dateFin])
                ->selectRaw('MONTH(date_annulation) as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->orderBy('mois')
                ->get(),
        ];

        return response()->json($stats);
    }
}
