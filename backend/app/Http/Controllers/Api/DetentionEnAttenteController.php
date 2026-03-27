<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

/**
 * Contrôleur pour les détentions en attente.
 * Lit depuis la table `detentions` de la base TC (connexion `ops`).
 * Filtre uniquement les conteneurs avec responsabilité attribuée (Client ou Compagnie).
 */
class DetentionEnAttenteController extends Controller
{
    /**
     * Liste paginée des détentions attribuées.
     */
    public function index(Request $request)
    {
        try {
            if (!$this->isOpsAvailable()) {
                return response()->json([
                    'data' => [],
                    'meta' => $this->emptyMeta(),
                    'source_errors' => ['ops' => 'Base TC non disponible'],
                ]);
            }

            $query = DB::connection('ops')->table('detentions')
                ->whereIn('responsabilite', ['Client', 'Compagnie', 'Logistiga'])
                ->where('responsabilite', '!=', 'Non attribuée');

            // Filtres
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('numero_conteneur', 'like', "%{$search}%")
                      ->orWhere('numero_bl', 'like', "%{$search}%")
                      ->orWhere('client_nom', 'like', "%{$search}%")
                      ->orWhere('armateur_code', 'like', "%{$search}%");
                });
            }

            if ($responsabilite = $request->input('responsabilite')) {
                $query->where('responsabilite', $responsabilite);
            }

            if ($armateur = $request->input('armateur_code')) {
                $query->where('armateur_code', $armateur);
            }

            if ($paiement = $request->input('paiement_valide')) {
                $query->where('paiement_valide', $paiement === 'true' || $paiement === '1');
            }

            // Tri
            $sortBy = $request->input('sort_by', 'jours_detention');
            $sortDir = $request->input('sort_dir', 'desc');
            $allowedSorts = [
                'numero_conteneur', 'client_nom', 'armateur_code',
                'jours_detention', 'cout_total', 'responsabilite',
                'date_sortie', 'date_retour', 'cout_client', 'cout_compagnie',
            ];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
            }

            $perPage = min((int) $request->input('per_page', 20), 100);
            $results = $query->paginate($perPage);

            return response()->json([
                'data' => collect($results->items())->map(fn ($row) => $this->formatRow($row)),
                'meta' => [
                    'current_page' => $results->currentPage(),
                    'last_page' => $results->lastPage(),
                    'per_page' => $results->perPage(),
                    'total' => $results->total(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('DetentionEnAttente.index error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'data' => [],
                'meta' => $this->emptyMeta(),
                'source_errors' => ['ops' => $e->getMessage()],
            ]);
        }
    }

    /**
     * Statistiques des détentions attribuées.
     */
    public function stats(Request $request)
    {
        try {
            if (!$this->isOpsAvailable()) {
                return response()->json($this->emptyStats());
            }

            $base = DB::connection('ops')->table('detentions')
                ->whereIn('responsabilite', ['Client', 'Compagnie', 'Logistiga'])
                ->where('responsabilite', '!=', 'Non attribuée');

            $total = (clone $base)->count();
            $totalClient = (clone $base)->where('responsabilite', 'Client')->count();
            $totalCompagnie = (clone $base)->whereIn('responsabilite', ['Compagnie', 'Logistiga'])->count();
            $coutTotal = (clone $base)->sum('cout_total') ?? 0;
            $coutClient = (clone $base)->sum('cout_client') ?? 0;
            $coutCompagnie = (clone $base)->sum('cout_compagnie') ?? 0;
            $joursMax = (clone $base)->max('jours_detention') ?? 0;
            $joursMoyen = (clone $base)->avg('jours_detention') ?? 0;
            $nonPayes = (clone $base)->where('paiement_valide', false)->count();

            return response()->json([
                'total' => $total,
                'total_client' => $totalClient,
                'total_compagnie' => $totalCompagnie,
                'cout_total' => (int) $coutTotal,
                'cout_client' => (int) $coutClient,
                'cout_compagnie' => (int) $coutCompagnie,
                'jours_max' => (int) $joursMax,
                'jours_moyen' => round((float) $joursMoyen, 1),
                'non_payes' => $nonPayes,
            ]);
        } catch (\Throwable $e) {
            Log::error('DetentionEnAttente.stats error', ['message' => $e->getMessage()]);
            return response()->json($this->emptyStats());
        }
    }

    // ─── Helpers ────────────────────────────────────────────

    private function isOpsAvailable(): bool
    {
        try {
            return Schema::connection('ops')->hasTable('detentions');
        } catch (\Throwable) {
            return false;
        }
    }

    private function formatRow(object $row): array
    {
        return [
            'id' => $row->id ?? null,
            'numero_conteneur' => $row->numero_conteneur ?? '',
            'numero_bl' => $row->numero_bl ?? '',
            'client_nom' => $row->client_nom ?? '',
            'armateur_code' => $row->armateur_code ?? '',
            'date_sortie' => $row->date_sortie ?? null,
            'date_retour' => $row->date_retour ?? null,
            'jours_gratuits' => (int) ($row->jours_gratuits ?? 0),
            'jours_detention' => (int) ($row->jours_detention ?? 0),
            'prix_par_jour' => (int) ($row->prix_par_jour ?? 0),
            'cout_total' => (int) ($row->cout_total ?? 0),
            'responsabilite' => $row->responsabilite ?? '',
            'jours_client' => (int) ($row->jours_client ?? 0),
            'jours_compagnie' => (int) ($row->jours_compagnie ?? 0),
            'cout_client' => (int) ($row->cout_client ?? 0),
            'cout_compagnie' => (int) ($row->cout_compagnie ?? 0),
            'paiement_valide' => (bool) ($row->paiement_valide ?? false),
            'sortie_id' => $row->sortie_id ?? null,
        ];
    }

    private function emptyMeta(): array
    {
        return ['current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0];
    }

    private function emptyStats(): array
    {
        return [
            'total' => 0, 'total_client' => 0, 'total_compagnie' => 0,
            'cout_total' => 0, 'cout_client' => 0, 'cout_compagnie' => 0,
            'jours_max' => 0, 'jours_moyen' => 0, 'non_payes' => 0,
        ];
    }
}
