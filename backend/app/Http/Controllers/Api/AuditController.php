<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditResource;
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
                      ->orWhere('module', 'like', "%{$search}%")
                      ->orWhere('details', 'like', "%{$search}%")
                      ->orWhere('document_id', $search)
                      ->orWhere('document_numero', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('nom', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            if ($request->has('action')) {
                $query->where('action', $request->get('action'));
            }

            // Support pour 'module' et 'table_name' (legacy)
            if ($request->has('module')) {
                $query->where('module', $request->get('module'));
            } elseif ($request->has('table_name')) {
                $query->where('module', $request->get('table_name'));
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

            // Utiliser AuditResource pour formater correctement les données avec user.name
            return AuditResource::collection($audits)->response();
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
        return (new AuditResource($audit))->response();
    }

    public function actions(): JsonResponse
    {
        $actions = Audit::distinct('action')->pluck('action');
        return response()->json($actions);
    }

    public function tables(): JsonResponse
    {
        $modules = Audit::distinct('module')->whereNotNull('module')->pluck('module');
        return response()->json($modules);
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
                ->selectRaw('module, COUNT(*) as total')
                ->groupBy('module')
                ->get(),
            'par_utilisateur' => Audit::whereBetween('created_at', [$dateDebut, $dateFin])
                ->with('user')
                ->selectRaw('user_id, COUNT(*) as total')
                ->groupBy('user_id')
                ->get()
                ->map(fn($item) => [
                    'user_id' => $item->user_id,
                    'total' => $item->total,
                    'user' => $item->user ? ['id' => $item->user->id, 'name' => $item->user->name] : null,
                ]),
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
            'data' => AuditResource::collection($audits),
            'total' => $audits->count(),
        ]);
    }
}
