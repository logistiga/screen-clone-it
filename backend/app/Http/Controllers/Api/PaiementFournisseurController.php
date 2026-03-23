<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Audit;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Gère les paiements fournisseurs par tranche (avances)
 * 
 * Table: paiements_fournisseurs (facture principale)
 * Table: tranches_paiement_fournisseur (chaque avance/tranche)
 */
class PaiementFournisseurController extends Controller
{
    /**
     * Liste des paiements fournisseurs en cours
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 20);
        $search = $request->get('search');
        $statut = $request->get('statut', 'all'); // en_cours, solde, all

        $query = DB::table('paiements_fournisseurs as pf')
            ->select([
                'pf.*',
                DB::raw('COALESCE((SELECT SUM(tp.montant) FROM tranches_paiement_fournisseur tp WHERE tp.paiement_fournisseur_id = pf.id), 0) as total_paye'),
                DB::raw('COALESCE((SELECT COUNT(*) FROM tranches_paiement_fournisseur tp WHERE tp.paiement_fournisseur_id = pf.id), 0) as nombre_tranches'),
            ])
            ->orderByDesc('pf.created_at');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('pf.fournisseur', 'like', "%{$search}%")
                  ->orWhere('pf.reference', 'like', "%{$search}%")
                  ->orWhere('pf.description', 'like', "%{$search}%");
            });
        }

        if ($statut === 'en_cours') {
            $query->havingRaw('total_paye < pf.montant_total');
        } elseif ($statut === 'solde') {
            $query->havingRaw('total_paye >= pf.montant_total');
        }

        $results = $query->paginate($perPage);

        // Enrichir les données
        $results->getCollection()->transform(function ($item) {
            $item->reste = max(0, $item->montant_total - $item->total_paye);
            $item->pourcentage = $item->montant_total > 0
                ? round(($item->total_paye / $item->montant_total) * 100, 1)
                : 0;
            $item->est_solde = $item->total_paye >= $item->montant_total;
            return $item;
        });

        return response()->json($results);
    }

    /**
     * Stats globales des paiements fournisseurs
     */
    public function stats(): JsonResponse
    {
        $all = DB::table('paiements_fournisseurs as pf')
            ->select([
                DB::raw('COUNT(*) as total_factures'),
                DB::raw('SUM(pf.montant_total) as montant_total_factures'),
            ])
            ->first();

        $totalPaye = DB::table('tranches_paiement_fournisseur')->sum('montant');
        
        $enCours = DB::table('paiements_fournisseurs as pf')
            ->select(['pf.id', 'pf.montant_total'])
            ->get()
            ->filter(function ($pf) {
                $paye = DB::table('tranches_paiement_fournisseur')
                    ->where('paiement_fournisseur_id', $pf->id)
                    ->sum('montant');
                return $paye < $pf->montant_total;
            });

        return response()->json([
            'total_factures' => (int) ($all->total_factures ?? 0),
            'montant_total' => (float) ($all->montant_total_factures ?? 0),
            'total_paye' => (float) $totalPaye,
            'reste_a_payer' => (float) (($all->montant_total_factures ?? 0) - $totalPaye),
            'en_cours' => $enCours->count(),
            'soldes' => (int) ($all->total_factures ?? 0) - $enCours->count(),
        ]);
    }

    /**
     * Créer une facture fournisseur à payer par tranches
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fournisseur' => 'required|string|max:255',
            'reference' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'montant_total' => 'required|numeric|min:1',
            'date_facture' => 'required|date',
            'source' => 'nullable|string|max:50',
            'source_id' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $id = DB::table('paiements_fournisseurs')->insertGetId([
                'fournisseur' => $request->fournisseur,
                'reference' => $request->reference,
                'description' => $request->description,
                'montant_total' => $request->montant_total,
                'date_facture' => $request->date_facture,
                'source' => $request->source,
                'source_id' => $request->source_id,
                'created_by' => $request->user()?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Audit::log('create', 'paiement_fournisseur', "Nouvelle facture fournisseur: {$request->fournisseur} - {$request->montant_total}", $id);

            return response()->json([
                'message' => 'Facture fournisseur créée avec succès',
                'id' => $id,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Détail d'une facture fournisseur avec ses tranches
     */
    public function show(int $id): JsonResponse
    {
        $pf = DB::table('paiements_fournisseurs')->find($id);
        if (!$pf) {
            return response()->json(['message' => 'Facture non trouvée'], 404);
        }

        $tranches = DB::table('tranches_paiement_fournisseur')
            ->where('paiement_fournisseur_id', $id)
            ->orderByDesc('date_paiement')
            ->get();

        $totalPaye = $tranches->sum('montant');
        $pf->total_paye = $totalPaye;
        $pf->reste = max(0, $pf->montant_total - $totalPaye);
        $pf->pourcentage = $pf->montant_total > 0 ? round(($totalPaye / $pf->montant_total) * 100, 1) : 0;
        $pf->est_solde = $totalPaye >= $pf->montant_total;
        $pf->tranches = $tranches;

        return response()->json($pf);
    }

    /**
     * Ajouter une avance/tranche de paiement
     */
    public function avancer(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'montant' => 'required|numeric|min:1',
            'mode_paiement' => 'required|in:Espèces,Virement,Chèque,Mobile Money',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pf = DB::table('paiements_fournisseurs')->find($id);
        if (!$pf) {
            return response()->json(['message' => 'Facture non trouvée'], 404);
        }

        $totalPaye = DB::table('tranches_paiement_fournisseur')
            ->where('paiement_fournisseur_id', $id)
            ->sum('montant');

        $reste = $pf->montant_total - $totalPaye;
        $montant = (float) $request->montant;

        if ($montant > $reste) {
            return response()->json([
                'message' => "Le montant ({$montant}) dépasse le reste à payer ({$reste})",
            ], 422);
        }

        try {
            DB::beginTransaction();

            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);
            $numTranche = DB::table('tranches_paiement_fournisseur')
                ->where('paiement_fournisseur_id', $id)
                ->count() + 1;

            // Créer la tranche
            $trancheId = DB::table('tranches_paiement_fournisseur')->insertGetId([
                'paiement_fournisseur_id' => $id,
                'montant' => $montant,
                'mode_paiement' => $request->mode_paiement,
                'reference' => $request->reference,
                'notes' => $request->notes,
                'date_paiement' => now()->toDateString(),
                'numero_tranche' => $numTranche,
                'created_by' => $request->user()?->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Créer le mouvement de caisse
            $description = "Avance #{$numTranche} - {$pf->fournisseur} - Réf: {$pf->reference}";
            $refUnique = "PF-{$id}-T{$numTranche}";

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => 'Paiement Fournisseur',
                'montant' => $montant,
                'description' => $description,
                'beneficiaire' => $pf->fournisseur,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            // Mettre à jour le mouvement_id dans la tranche
            DB::table('tranches_paiement_fournisseur')
                ->where('id', $trancheId)
                ->update(['mouvement_id' => $mouvement->id]);

            $nouveauTotal = $totalPaye + $montant;
            $nouveauReste = $pf->montant_total - $nouveauTotal;

            Audit::log('create', 'avance_fournisseur', "Avance #{$numTranche}: {$montant} pour {$pf->fournisseur} (reste: {$nouveauReste})", $trancheId);

            DB::commit();

            return response()->json([
                'message' => 'Avance enregistrée avec succès',
                'tranche_id' => $trancheId,
                'mouvement_id' => $mouvement->id,
                'total_paye' => $nouveauTotal,
                'reste' => $nouveauReste,
                'est_solde' => $nouveauReste <= 0,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de l\'avance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer une facture fournisseur (si aucune tranche payée)
     */
    public function destroy(int $id): JsonResponse
    {
        $pf = DB::table('paiements_fournisseurs')->find($id);
        if (!$pf) {
            return response()->json(['message' => 'Facture non trouvée'], 404);
        }

        $hasTranches = DB::table('tranches_paiement_fournisseur')
            ->where('paiement_fournisseur_id', $id)
            ->exists();

        if ($hasTranches) {
            return response()->json([
                'message' => 'Impossible de supprimer: des tranches de paiement existent déjà',
            ], 422);
        }

        DB::table('paiements_fournisseurs')->where('id', $id)->delete();
        Audit::log('delete', 'paiement_fournisseur', "Suppression facture fournisseur: {$pf->fournisseur}", $id);

        return response()->json(['message' => 'Facture supprimée']);
    }
}
