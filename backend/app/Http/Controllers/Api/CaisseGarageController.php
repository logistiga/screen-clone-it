<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

/**
 * Contrôleur pour les achats Garage en attente de validation
 * 
 * Tables concernées (base garage) :
 * - bon_commandes (statut: brouillon → validé)
 * - achat_pneus (statut: en_attente → valide)
 * - achats_divers (statut: en_attente → valide)
 * - fournisseurs (table de référence)
 */
class CaisseGarageController extends Controller
{
    private const PISTON_GABON = 'piston gabon';

    public function isAvailable(): bool
    {
        try {
            $connection = DB::connection('garage');
            $connection->getPdo();
            return $connection->getSchemaBuilder()->hasTable('bon_commandes');
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Stats globales des achats garage
     */
    public function stats(Request $request): JsonResponse
    {
        if (!$this->isAvailable()) {
            return response()->json([
                'total_en_attente' => 0,
                'nombre_en_attente' => 0,
                'total_valide' => 0,
                'nombre_valide' => 0,
                'message' => 'Base Garage indisponible',
            ]);
        }

        try {
            $filter = $request->get('fournisseur_filter', 'all'); // all, piston, autres

            $bcStats = $this->getBonCommandeStats($filter);
            $pneuStats = $this->getAchatPneuStats($filter);
            $diversStats = $this->getAchatDiversStats($filter);

            return response()->json([
                'total_en_attente' => $bcStats['en_attente_montant'] + $pneuStats['en_attente_montant'] + $diversStats['en_attente_montant'],
                'nombre_en_attente' => $bcStats['en_attente_count'] + $pneuStats['en_attente_count'] + $diversStats['en_attente_count'],
                'total_valide' => $bcStats['valide_montant'] + $pneuStats['valide_montant'] + $diversStats['valide_montant'],
                'nombre_valide' => $bcStats['valide_count'] + $pneuStats['valide_count'] + $diversStats['valide_count'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'total_en_attente' => 0,
                'nombre_en_attente' => 0,
                'total_valide' => 0,
                'nombre_valide' => 0,
                'error' => 'Erreur: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Liste des achats garage (bon_commandes + achat_pneus + achats_divers)
     */
    public function index(Request $request): JsonResponse
    {
        if (!$this->isAvailable()) {
            return response()->json([
                'data' => [],
                'meta' => ['total' => 0, 'last_page' => 1, 'current_page' => 1, 'per_page' => 20],
                'message' => 'Base Garage indisponible',
            ]);
        }

        try {
            $perPage = (int) $request->get('per_page', 20);
            $page = (int) $request->get('page', 1);
            $search = $request->get('search');
            $statut = $request->get('statut', 'en_attente');
            $fournisseurFilter = $request->get('fournisseur_filter', 'all');

            $allItems = collect();

            // Bons de commande
            if (Schema::connection('garage')->hasTable('bon_commandes')) {
                $allItems = $allItems->merge($this->fetchBonCommandes($search, $fournisseurFilter));
            }

            // Achats pneus
            if (Schema::connection('garage')->hasTable('achat_pneus')) {
                $allItems = $allItems->merge($this->fetchAchatPneus($search, $fournisseurFilter));
            }

            // Achats divers
            if (Schema::connection('garage')->hasTable('achats_divers')) {
                $allItems = $allItems->merge($this->fetchAchatsDivers($search, $fournisseurFilter));
            }

            // Filtrer par statut
            if ($statut === 'en_attente') {
                $allItems = $allItems->filter(fn($item) => in_array($item['statut'], ['brouillon', 'en_attente']));
            } elseif ($statut === 'valide') {
                $allItems = $allItems->filter(fn($item) => in_array($item['statut'], ['validé', 'valide', 'validated']));
            }

            // Trier par date desc
            $allItems = $allItems->sortByDesc('date')->values();

            $total = $allItems->count();
            $lastPage = max(1, ceil($total / $perPage));
            $items = $allItems->forPage($page, $perPage)->values();

            return response()->json([
                'data' => $items,
                'meta' => [
                    'total' => $total,
                    'last_page' => $lastPage,
                    'current_page' => $page,
                    'per_page' => $perPage,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'data' => [],
                'meta' => ['total' => 0, 'last_page' => 1, 'current_page' => 1, 'per_page' => 20],
                'error' => 'Erreur: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Valider un achat garage
     */
    public function valider(Request $request, string $type, int $id): JsonResponse
    {
        if (!$this->isAvailable()) {
            return response()->json(['error' => 'Base Garage indisponible'], 503);
        }

        try {
            $tableMap = [
                'bon_commande' => 'bon_commandes',
                'achat_pneu' => 'achat_pneus',
                'achat_divers' => 'achats_divers',
            ];

            $table = $tableMap[$type] ?? null;
            if (!$table) {
                return response()->json(['error' => 'Type invalide'], 400);
            }

            $statutValide = $type === 'bon_commande' ? 'validé' : 'valide';

            DB::connection('garage')->table($table)
                ->where('id', $id)
                ->update(['statut' => $statutValide]);

            return response()->json(['success' => true, 'message' => 'Achat validé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }

    // ─── Private helpers ─────────────────────────────────

    private function fetchBonCommandes(?string $search, string $fournisseurFilter): \Illuminate\Support\Collection
    {
        $query = DB::connection('garage')
            ->table('bon_commandes')
            ->leftJoin('fournisseurs', 'bon_commandes.fournisseur_id', '=', 'fournisseurs.id')
            ->select([
                'bon_commandes.id',
                'bon_commandes.numero',
                'bon_commandes.date_commande as date',
                'bon_commandes.statut',
                'bon_commandes.montant_total as montant',
                'bon_commandes.created_at',
                'fournisseurs.raison_sociale as fournisseur_nom',
            ]);

        $query = $this->applyFournisseurFilter($query, $fournisseurFilter);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('bon_commandes.numero', 'like', "%{$search}%")
                  ->orWhere('fournisseurs.raison_sociale', 'like', "%{$search}%");
            });
        }

        return $query->get()->map(fn($row) => [
            'id' => $row->id,
            'type' => 'Bon de commande',
            'type_key' => 'bon_commande',
            'numero' => $row->numero,
            'fournisseur_nom' => $row->fournisseur_nom,
            'date' => $row->date,
            'montant' => (float) $row->montant,
            'statut' => $row->statut,
            'designation' => $row->numero,
            'created_at' => $row->created_at,
            'source' => 'GARAGE',
        ]);
    }

    private function fetchAchatPneus(?string $search, string $fournisseurFilter): \Illuminate\Support\Collection
    {
        $query = DB::connection('garage')
            ->table('achat_pneus')
            ->leftJoin('fournisseurs', 'achat_pneus.fournisseur_id', '=', 'fournisseurs.id')
            ->select([
                'achat_pneus.id',
                'achat_pneus.date_achat as date',
                'achat_pneus.marque',
                'achat_pneus.dimension',
                'achat_pneus.quantite',
                'achat_pneus.prix_unitaire',
                'achat_pneus.montant_total as montant',
                'achat_pneus.statut',
                'achat_pneus.created_at',
                'fournisseurs.raison_sociale as fournisseur_nom',
            ]);

        $query = $this->applyFournisseurFilter($query, $fournisseurFilter);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('achat_pneus.marque', 'like', "%{$search}%")
                  ->orWhere('achat_pneus.dimension', 'like', "%{$search}%")
                  ->orWhere('fournisseurs.raison_sociale', 'like', "%{$search}%");
            });
        }

        return $query->get()->map(fn($row) => [
            'id' => $row->id,
            'type' => 'Achat pneu',
            'type_key' => 'achat_pneu',
            'numero' => null,
            'fournisseur_nom' => $row->fournisseur_nom,
            'date' => $row->date,
            'montant' => (float) $row->montant,
            'statut' => $row->statut,
            'designation' => ($row->marque ?? '') . ' ' . ($row->dimension ?? '') . ' (x' . ($row->quantite ?? 1) . ')',
            'created_at' => $row->created_at,
            'source' => 'GARAGE',
        ]);
    }

    private function fetchAchatsDivers(?string $search, string $fournisseurFilter): \Illuminate\Support\Collection
    {
        $query = DB::connection('garage')
            ->table('achats_divers')
            ->leftJoin('fournisseurs', 'achats_divers.fournisseur_id', '=', 'fournisseurs.id')
            ->select([
                'achats_divers.id',
                'achats_divers.numero',
                'achats_divers.date_achat as date',
                'achats_divers.statut',
                'achats_divers.montant_total as montant',
                'achats_divers.created_at',
                'fournisseurs.raison_sociale as fournisseur_nom',
            ]);

        $query = $this->applyFournisseurFilter($query, $fournisseurFilter);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('achats_divers.numero', 'like', "%{$search}%")
                  ->orWhere('fournisseurs.raison_sociale', 'like', "%{$search}%");
            });
        }

        return $query->get()->map(fn($row) => [
            'id' => $row->id,
            'type' => 'Achat divers',
            'type_key' => 'achat_divers',
            'numero' => $row->numero,
            'fournisseur_nom' => $row->fournisseur_nom,
            'date' => $row->date,
            'montant' => (float) $row->montant,
            'statut' => $row->statut,
            'designation' => $row->numero,
            'created_at' => $row->created_at,
            'source' => 'GARAGE',
        ]);
    }

    private function applyFournisseurFilter($query, string $filter)
    {
        if ($filter === 'piston') {
            $query->whereRaw('LOWER(fournisseurs.raison_sociale) LIKE ?', ['%' . self::PISTON_GABON . '%']);
        } elseif ($filter === 'autres') {
            $query->where(function ($q) {
                $q->whereNull('fournisseurs.raison_sociale')
                  ->orWhereRaw('LOWER(fournisseurs.raison_sociale) NOT LIKE ?', ['%' . self::PISTON_GABON . '%']);
            });
        }
        return $query;
    }

    private function getBonCommandeStats(string $filter): array
    {
        $baseQuery = DB::connection('garage')->table('bon_commandes')
            ->leftJoin('fournisseurs', 'bon_commandes.fournisseur_id', '=', 'fournisseurs.id');
        $baseQuery = $this->applyFournisseurFilter($baseQuery, $filter);

        $enAttente = (clone $baseQuery)->whereIn('bon_commandes.statut', ['brouillon', 'en_attente']);
        $valide = (clone $baseQuery)->whereIn('bon_commandes.statut', ['validé', 'validated']);

        return [
            'en_attente_montant' => (float) $enAttente->sum('bon_commandes.montant_total'),
            'en_attente_count' => $enAttente->count(),
            'valide_montant' => (float) $valide->sum('bon_commandes.montant_total'),
            'valide_count' => $valide->count(),
        ];
    }

    private function getAchatPneuStats(string $filter): array
    {
        $baseQuery = DB::connection('garage')->table('achat_pneus')
            ->leftJoin('fournisseurs', 'achat_pneus.fournisseur_id', '=', 'fournisseurs.id');
        $baseQuery = $this->applyFournisseurFilter($baseQuery, $filter);

        $enAttente = (clone $baseQuery)->whereIn('achat_pneus.statut', ['en_attente', 'brouillon']);
        $valide = (clone $baseQuery)->whereIn('achat_pneus.statut', ['valide', 'validated']);

        return [
            'en_attente_montant' => (float) $enAttente->sum('achat_pneus.montant_total'),
            'en_attente_count' => $enAttente->count(),
            'valide_montant' => (float) $valide->sum('achat_pneus.montant_total'),
            'valide_count' => $valide->count(),
        ];
    }

    private function getAchatDiversStats(string $filter): array
    {
        $baseQuery = DB::connection('garage')->table('achats_divers')
            ->leftJoin('fournisseurs', 'achats_divers.fournisseur_id', '=', 'fournisseurs.id');
        $baseQuery = $this->applyFournisseurFilter($baseQuery, $filter);

        $enAttente = (clone $baseQuery)->whereIn('achats_divers.statut', ['en_attente', 'brouillon']);
        $valide = (clone $baseQuery)->whereIn('achats_divers.statut', ['valide', 'validated']);

        return [
            'en_attente_montant' => (float) $enAttente->sum('achats_divers.montant_total'),
            'en_attente_count' => $enAttente->count(),
            'valide_montant' => (float) $valide->sum('achats_divers.montant_total'),
            'valide_count' => $valide->count(),
        ];
    }
}
