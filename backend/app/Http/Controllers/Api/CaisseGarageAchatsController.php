<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

/**
 * Gère les achats Garage (bon_commandes, achat_pneus, achats_divers)
 * Lecture depuis la base garage, décaissement/refus local
 */
class CaisseGarageAchatsController extends Controller
{
    use CaisseGarageHelpersTrait;

    /**
     * Stats des achats garage validés
     */
    public function stats(Request $request): JsonResponse
    {
        if (!$this->isAvailable()) {
            return response()->json([
                'total_valide' => 0, 'nombre_primes' => 0,
                'total_a_decaisser' => 0, 'nombre_a_decaisser' => 0,
                'deja_decaissees' => 0, 'total_decaisse' => 0,
                'message' => 'Base Garage indisponible',
            ]);
        }

        try {
            $filter = $request->get('fournisseur_filter', 'all');
            $allItems = $this->fetchAllValidated(null, $filter);
            $allItems = $this->attachAchatDecaissementStatus($allItems);

            $aDecaisser = $allItems->filter(fn($i) => !$i->decaisse && !$i->refusee);
            $decaissees = $allItems->filter(fn($i) => $i->decaisse);

            return response()->json([
                'total_valide' => $allItems->sum('montant'),
                'nombre_primes' => $allItems->count(),
                'total_a_decaisser' => $aDecaisser->sum('montant'),
                'nombre_a_decaisser' => $aDecaisser->count(),
                'deja_decaissees' => $decaissees->count(),
                'total_decaisse' => $decaissees->sum('montant'),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'total_valide' => 0, 'nombre_primes' => 0,
                'total_a_decaisser' => 0, 'nombre_a_decaisser' => 0,
                'deja_decaissees' => 0, 'total_decaisse' => 0,
                'error' => 'Erreur: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Liste paginée des achats garage validés
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
            $statut = $request->get('statut', 'all');
            $fournisseurFilter = $request->get('fournisseur_filter', 'all');

            $allItems = $this->fetchAllValidated($search, $fournisseurFilter);
            $allItems = $this->attachAchatDecaissementStatus($allItems);

            if ($statut === 'a_decaisser') {
                $allItems = $allItems->filter(fn($i) => !$i->decaisse && !$i->refusee);
            } elseif ($statut === 'decaisse') {
                $allItems = $allItems->filter(fn($i) => $i->decaisse);
            } elseif ($statut === 'refusee') {
                $allItems = $allItems->filter(fn($i) => $i->refusee);
            }

            $allItems = $allItems->sortByDesc('date')->values();
            $total = $allItems->count();
            $items = $allItems->forPage($page, $perPage)->values();

            return response()->json([
                'data' => $items,
                'meta' => ['total' => $total, 'last_page' => max(1, ceil($total / $perPage)), 'current_page' => $page, 'per_page' => $perPage],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'data' => [],
                'meta' => ['total' => 0, 'last_page' => 1, 'current_page' => 1, 'per_page' => 20],
                'error' => 'Erreur: ' . $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Décaisser un achat garage validé
     */
    public function decaisser(Request $request, string $itemId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mode_paiement' => 'required|in:Espèces,Virement,Chèque,Mobile Money',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'categorie' => 'nullable|string|max:100',
            'montant' => 'nullable|numeric|min:1',
            'paiement_partiel' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item = $this->getAchatForDecaissement($itemId);
        if (!$item) {
            return response()->json(['message' => 'Achat non trouvé'], 404);
        }

        $refUnique = CaisseGarageController::buildRef($itemId);
        $categorie = $request->get('categorie') ?: CaisseGarageController::categorie();
        $isPaiementPartiel = $request->boolean('paiement_partiel', false);
        $montantDecaisse = $isPaiementPartiel && $request->has('montant')
            ? (float) $request->montant
            : (float) $item->montant;

        if ($montantDecaisse > $item->montant) {
            return response()->json(['message' => 'Le montant dépasse le montant de l\'achat'], 422);
        }

        $numTranche = null;
        $existingPF = null;

        if ($isPaiementPartiel && $montantDecaisse < $item->montant) {
            $existingPF = DB::table('paiements_fournisseurs')
                ->where('source', 'GARAGE')->where('source_id', $itemId)->first();

            if (!$existingPF) {
                $beneficiaire = $item->beneficiaire ?? $item->fournisseur_nom ?? 'Fournisseur Garage';
                $pfId = DB::table('paiements_fournisseurs')->insertGetId([
                    'fournisseur' => $beneficiaire,
                    'reference' => $refUnique,
                    'description' => "Achat Garage - {$beneficiaire}",
                    'montant_total' => $item->montant,
                    'date_facture' => now()->toDateString(),
                    'source' => 'GARAGE', 'source_id' => $itemId,
                    'created_by' => $request->user()?->id,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $existingPF = (object) ['id' => $pfId];
            }

            $totalDejaPaye = DB::table('tranches_paiement_fournisseur')
                ->where('paiement_fournisseur_id', $existingPF->id)->sum('montant');
            $reste = $item->montant - $totalDejaPaye;
            if ($montantDecaisse > $reste) {
                return response()->json(['message' => "Le montant ({$montantDecaisse}) dépasse le reste à payer ({$reste})"], 422);
            }

            $numTranche = DB::table('tranches_paiement_fournisseur')
                ->where('paiement_fournisseur_id', $existingPF->id)->count() + 1;
            $refUnique .= '-T' . $numTranche;
        } else {
            if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
                return response()->json(['message' => 'Cet achat a déjà été décaissé'], 422);
            }
        }

        try {
            DB::beginTransaction();

            $beneficiaire = $item->beneficiaire ?? $item->fournisseur_nom ?? 'Fournisseur Garage';
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            $description = "Achat Garage ({$item->type}) - {$beneficiaire}";
            if ($isPaiementPartiel) $description = "Avance - " . $description;

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => $categorie,
                'montant' => $montantDecaisse,
                'description' => $description,
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            if ($isPaiementPartiel && $montantDecaisse < $item->montant && isset($existingPF)) {
                DB::table('tranches_paiement_fournisseur')->insert([
                    'paiement_fournisseur_id' => $existingPF->id, 'montant' => $montantDecaisse,
                    'mode_paiement' => $request->mode_paiement, 'reference' => $request->reference,
                    'notes' => $request->notes, 'date_paiement' => now()->toDateString(),
                    'numero_tranche' => $numTranche ?? 1, 'mouvement_id' => $mouvement->id,
                    'created_by' => $request->user()?->id, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            Audit::log('create', 'decaissement_garage', "Décaissement achat Garage: {$montantDecaisse} - {$beneficiaire}" . ($isPaiementPartiel ? ' (partiel)' : ''), $mouvement->id);
            DB::commit();

            return response()->json([
                'message' => $isPaiementPartiel ? 'Avance enregistrée avec succès' : 'Décaissement validé avec succès',
                'mouvement' => $mouvement,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors du décaissement', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Refuser un achat garage
     */
    public function refuser(Request $request, string $itemId): JsonResponse
    {
        $reference = CaisseGarageController::buildRef($itemId);

        if (DB::table('primes_refusees')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cet achat a déjà été refusé'], 422);
        }
        if (DB::table('mouvements_caisse')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cet achat a déjà été décaissé, impossible de le refuser'], 422);
        }

        try {
            DB::table('primes_refusees')->insert([
                'prime_id' => $itemId,
                'source' => 'GARAGE',
                'reference' => $reference,
                'motif' => $request->get('motif'),
                'user_id' => $request->user()?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Audit::log('create', 'refus_garage', "Refus achat Garage: {$itemId}", null);
            return response()->json(['message' => 'Achat refusé avec succès'], 200);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur lors du refus', 'error' => $e->getMessage()], 500);
        }
    }

    // ── Private helpers ──

    private function fetchAllValidated(?string $search, string $fournisseurFilter): \Illuminate\Support\Collection
    {
        $allItems = collect();
        $hasFournisseursTable = Schema::connection('garage')->hasTable('fournisseurs');

        if (Schema::connection('garage')->hasTable('bon_commandes')) {
            $allItems = $allItems->merge($this->fetchBonCommandes($search, $fournisseurFilter, $hasFournisseursTable));
        }
        if (Schema::connection('garage')->hasTable('achat_pneus')) {
            $allItems = $allItems->merge($this->fetchAchatPneus($search, $fournisseurFilter, $hasFournisseursTable));
        }
        if (Schema::connection('garage')->hasTable('achats_divers')) {
            $allItems = $allItems->merge($this->fetchAchatsDivers($search, $fournisseurFilter, $hasFournisseursTable));
        }

        return $allItems;
    }

    private function fetchBonCommandes(?string $search, string $fournisseurFilter, bool $hasFournisseursTable): \Illuminate\Support\Collection
    {
        $query = DB::connection('garage')->table('bon_commandes')->whereIn('bon_commandes.statut', ['validé', 'validated']);

        if ($hasFournisseursTable) {
            $query->leftJoin('fournisseurs', 'bon_commandes.fournisseur_id', '=', 'fournisseurs.id');
        }

        $query->select([
            'bon_commandes.id', 'bon_commandes.numero',
            'bon_commandes.date_commande as date', 'bon_commandes.montant_total as montant', 'bon_commandes.created_at',
            DB::raw($hasFournisseursTable ? 'fournisseurs.raison_sociale as fournisseur_nom' : 'NULL as fournisseur_nom'),
        ]);

        $query = $this->applyFournisseurFilter($query, $fournisseurFilter, $hasFournisseursTable);

        if ($search) {
            $query->where(function ($q) use ($search, $hasFournisseursTable) {
                $q->where('bon_commandes.numero', 'like', "%{$search}%");
                if ($hasFournisseursTable) {
                    $q->orWhere('fournisseurs.raison_sociale', 'like', "%{$search}%");
                }
            });
        }

        return $query->get()->map(fn($row) => (object) [
            'id' => 'bc-' . $row->id, 'type' => 'Bon de commande', 'type_key' => 'bon_commande',
            'numero' => $row->numero, 'beneficiaire' => $row->fournisseur_nom, 'fournisseur_nom' => $row->fournisseur_nom,
            'date' => $row->date, 'montant' => (float) $row->montant, 'designation' => $row->numero,
            'created_at' => $row->created_at, 'source' => 'GARAGE',
        ]);
    }

    private function fetchAchatPneus(?string $search, string $fournisseurFilter, bool $hasFournisseursTable): \Illuminate\Support\Collection
    {
        $query = DB::connection('garage')->table('achat_pneus')->whereIn('achat_pneus.statut', ['valide', 'validated']);

        if ($hasFournisseursTable) {
            $query->leftJoin('fournisseurs', 'achat_pneus.fournisseur_id', '=', 'fournisseurs.id');
        }

        $query->select([
            'achat_pneus.id', 'achat_pneus.date_achat as date', 'achat_pneus.marque', 'achat_pneus.dimension',
            'achat_pneus.quantite', 'achat_pneus.montant_total as montant', 'achat_pneus.created_at',
            DB::raw($hasFournisseursTable ? 'fournisseurs.raison_sociale as fournisseur_nom' : 'NULL as fournisseur_nom'),
        ]);

        $query = $this->applyFournisseurFilter($query, $fournisseurFilter, $hasFournisseursTable);

        if ($search) {
            $query->where(function ($q) use ($search, $hasFournisseursTable) {
                $q->where('achat_pneus.marque', 'like', "%{$search}%")
                  ->orWhere('achat_pneus.dimension', 'like', "%{$search}%");
                if ($hasFournisseursTable) {
                    $q->orWhere('fournisseurs.raison_sociale', 'like', "%{$search}%");
                }
            });
        }

        return $query->get()->map(fn($row) => (object) [
            'id' => 'pn-' . $row->id, 'type' => 'Achat pneu', 'type_key' => 'achat_pneu',
            'numero' => null, 'beneficiaire' => $row->fournisseur_nom, 'fournisseur_nom' => $row->fournisseur_nom,
            'date' => $row->date, 'montant' => (float) $row->montant,
            'designation' => ($row->marque ?? '') . ' ' . ($row->dimension ?? '') . ' (x' . ($row->quantite ?? 1) . ')',
            'created_at' => $row->created_at, 'source' => 'GARAGE',
        ]);
    }

    private function fetchAchatsDivers(?string $search, string $fournisseurFilter, bool $hasFournisseursTable): \Illuminate\Support\Collection
    {
        $query = DB::connection('garage')->table('achats_divers')->whereIn('achats_divers.statut', ['valide', 'validated']);

        if ($hasFournisseursTable) {
            $query->leftJoin('fournisseurs', 'achats_divers.fournisseur_id', '=', 'fournisseurs.id');
        }

        $query->select([
            'achats_divers.id', 'achats_divers.numero', 'achats_divers.date_achat as date',
            'achats_divers.montant_total as montant', 'achats_divers.created_at',
            DB::raw($hasFournisseursTable ? 'fournisseurs.raison_sociale as fournisseur_nom' : 'NULL as fournisseur_nom'),
        ]);

        $query = $this->applyFournisseurFilter($query, $fournisseurFilter, $hasFournisseursTable);

        if ($search) {
            $query->where(function ($q) use ($search, $hasFournisseursTable) {
                $q->where('achats_divers.numero', 'like', "%{$search}%");
                if ($hasFournisseursTable) {
                    $q->orWhere('fournisseurs.raison_sociale', 'like', "%{$search}%");
                }
            });
        }

        return $query->get()->map(fn($row) => (object) [
            'id' => 'div-' . $row->id, 'type' => 'Achat divers', 'type_key' => 'achat_divers',
            'numero' => $row->numero, 'beneficiaire' => $row->fournisseur_nom, 'fournisseur_nom' => $row->fournisseur_nom,
            'date' => $row->date, 'montant' => (float) $row->montant, 'designation' => $row->numero,
            'created_at' => $row->created_at, 'source' => 'GARAGE',
        ]);
    }

    public function getAchatForDecaissement(string $itemId): ?object
    {
        if (!$this->isAvailable()) return null;
        return $this->fetchAllValidated(null, 'all')->firstWhere('id', $itemId);
    }

    private function attachAchatDecaissementStatus(\Illuminate\Support\Collection $items): \Illuminate\Support\Collection
    {
        if ($items->isEmpty()) return $items;

        $refs = $items->map(fn($i) => CaisseGarageController::buildRef($i->id))->toArray();

        $mouvements = DB::table('mouvements_caisse')
            ->where('categorie', CaisseGarageController::categorie())
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])
            ->keyBy('reference');

        $refusees = DB::table('primes_refusees')->whereIn('reference', $refs)->pluck('reference')->toArray();

        return $items->map(function ($item) use ($mouvements, $refusees) {
            $ref = CaisseGarageController::buildRef($item->id);
            $mouvement = $mouvements[$ref] ?? null;
            $item->decaisse = $mouvement !== null;
            $item->mouvement_id = $mouvement?->id;
            $item->date_decaissement = $mouvement?->date;
            $item->mode_paiement_decaissement = $mouvement?->mode_paiement;
            $item->refusee = in_array($ref, $refusees);
            return $item;
        });
    }
}
