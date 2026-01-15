<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Audit::with('user');

            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('action', 'like', "%{$search}%")
                      ->orWhere('table_name', 'like', "%{$search}%")
                      ->orWhere('details', 'like', "%{$search}%")
                      ->orWhere('document_id', $search)
                      ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$search}%"));
                });
            }

            if ($request->has('action')) {
                $query->where('action', $request->get('action'));
            }

            // Support pour 'module' et 'table_name'
            if ($request->has('module')) {
                $query->where('table_name', $request->get('module'));
            } elseif ($request->has('table_name')) {
                $query->where('table_name', $request->get('table_name'));
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->get('user_id'));
            }

            if ($request->has('document_id')) {
                $query->where('document_id', $request->get('document_id'));
            }

            if ($request->has('date_debut') && $request->has('date_fin')) {
                $query->whereBetween('created_at', [$request->get('date_debut'), $request->get('date_fin')]);
            }

            $audits = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));

            return response()->json($audits);
        } catch (\Exception $e) {
            \Log::error('Erreur audit index', [
                'message' => $e->getMessage(),
                'params' => $request->all(),
            ]);
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $request->get('per_page', 20),
                'total' => 0,
            ]);
        }
    }

    public function show(Audit $audit): JsonResponse
    {
        $audit->load('user');
        return response()->json($audit);
    }

    public function actions(): JsonResponse
    {
        $actions = Audit::distinct('action')->pluck('action');
        return response()->json($actions);
    }

    public function tables(): JsonResponse
    {
        $tables = Audit::distinct('table_name')->pluck('table_name');
        return response()->json($tables);
    }

    public function stats(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut', now()->startOfMonth());
        $dateFin = $request->get('date_fin', now()->endOfMonth());

        $stats = [
            'total' => Audit::whereBetween('created_at', [$dateDebut, $dateFin])->count(),
            'par_action' => Audit::whereBetween('created_at', [$dateDebut, $dateFin])
                ->selectRaw('action, COUNT(*) as total')
                ->groupBy('action')
                ->get(),
            'par_table' => Audit::whereBetween('created_at', [$dateDebut, $dateFin])
                ->selectRaw('table_name, COUNT(*) as total')
                ->groupBy('table_name')
                ->get(),
            'par_utilisateur' => Audit::whereBetween('created_at', [$dateDebut, $dateFin])
                ->with('user:id,name')
                ->selectRaw('user_id, COUNT(*) as total')
                ->groupBy('user_id')
                ->get(),
            'par_jour' => Audit::whereBetween('created_at', [$dateDebut, $dateFin])
                ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
        ];

        return response()->json($stats);
    }

    public function export(Request $request): JsonResponse
    {
        $query = Audit::with('user');

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('created_at', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $audits = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $audits,
            'total' => $audits->count(),
        ]);
    }
}
