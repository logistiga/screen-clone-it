<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCreditBancaireRequest;
use App\Http\Requests\RembourserCreditRequest;
use App\Http\Resources\CreditBancaireResource;
use App\Http\Resources\EcheanceCreditResource;
use App\Http\Resources\RemboursementCreditResource;
use App\Http\Resources\DocumentCreditResource;
use App\Models\CreditBancaire;
use App\Models\EcheanceCredit;
use App\Models\RemboursementCredit;
use App\Models\DocumentCredit;
use App\Models\ModificationCredit;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * CRUD Crédits bancaires - Stats/Dashboard déléguées à CreditBancaireStatsController
 */
class CreditBancaireController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CreditBancaire::with(['banque', 'echeances', 'remboursements']);
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")->orWhere('objet', 'like', "%{$search}%")->orWhereHas('banque', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }
        if ($request->has('statut')) $query->where('statut', $request->get('statut'));
        if ($request->has('banque_id')) $query->where('banque_id', $request->get('banque_id'));

        $credits = $query->orderBy('date_debut', 'desc')->paginate($request->get('per_page', 15));
        return response()->json(CreditBancaireResource::collection($credits)->response()->getData(true));
    }

    public function store(StoreCreditBancaireRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $montantEmprunte = $request->montant_emprunte;
            $dureeEnMois = $request->duree_en_mois;
            $tauxInteret = $request->taux_interet;
            $totalInterets = $montantEmprunte * ($tauxInteret / 100) * ($dureeEnMois / 12);
            $mensualite = ($montantEmprunte + $totalInterets) / $dureeEnMois;

            $credit = CreditBancaire::create([
                'numero' => $this->generateNumero(), 'banque_id' => $request->banque_id, 'objet' => $request->objet,
                'montant_emprunte' => $montantEmprunte, 'taux_interet' => $tauxInteret, 'total_interets' => $totalInterets,
                'mensualite' => $mensualite, 'duree_en_mois' => $dureeEnMois, 'date_debut' => $request->date_debut,
                'date_fin' => date('Y-m-d', strtotime($request->date_debut . " + {$dureeEnMois} months")),
                'notes' => $request->notes, 'statut' => 'actif', 'montant_rembourse' => 0,
            ]);

            for ($i = 1; $i <= $dureeEnMois; $i++) {
                EcheanceCredit::create([
                    'credit_id' => $credit->id, 'numero' => $i,
                    'date_echeance' => date('Y-m-d', strtotime($request->date_debut . " + {$i} months")),
                    'montant_capital' => $montantEmprunte / $dureeEnMois, 'montant_interet' => $totalInterets / $dureeEnMois,
                    'montant_total' => $mensualite, 'montant_paye' => 0, 'statut' => 'a_payer',
                ]);
            }

            Audit::log('create', 'credit', "Crédit créé: {$credit->numero}", $credit->id);
            DB::commit();
            return response()->json(new CreditBancaireResource($credit->load(['banque', 'echeances'])), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(CreditBancaire $creditBancaire): JsonResponse
    {
        $creditBancaire->load(['banque', 'echeances', 'remboursements', 'documents', 'modifications']);
        return response()->json(new CreditBancaireResource($creditBancaire));
    }

    public function update(Request $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $validator = Validator::make($request->all(), ['objet' => 'sometimes|required|string|max:255', 'notes' => 'nullable|string', 'statut' => 'sometimes|in:Actif,Soldé,En défaut']);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        if ($request->has('objet') || $request->has('notes')) {
            ModificationCredit::create(['credit_bancaire_id' => $creditBancaire->id, 'type_modification' => 'Modification informations', 'ancien_valeur' => json_encode($creditBancaire->only(['objet', 'notes'])), 'nouveau_valeur' => json_encode($request->only(['objet', 'notes'])), 'user_id' => auth()->id()]);
        }
        $creditBancaire->update($request->only(['objet', 'notes', 'statut']));
        Audit::log('update', 'credit', "Crédit modifié: {$creditBancaire->numero}", $creditBancaire->id);
        return response()->json(new CreditBancaireResource($creditBancaire->load(['banque', 'echeances'])));
    }

    public function destroy(CreditBancaire $creditBancaire): JsonResponse
    {
        if ($creditBancaire->remboursements()->count() > 0) return response()->json(['message' => 'Impossible de supprimer un crédit avec des remboursements'], 422);
        Audit::log('delete', 'credit', "Crédit supprimé: {$creditBancaire->numero}", $creditBancaire->id);
        $creditBancaire->echeances()->delete();
        $creditBancaire->documents()->delete();
        $creditBancaire->delete();
        return response()->json(['message' => 'Crédit supprimé avec succès']);
    }

    public function annuler(Request $request, CreditBancaire $creditBancaire): JsonResponse
    {
        if ($creditBancaire->statut === 'annule' || $creditBancaire->statut === 'Annulé') return response()->json(['message' => 'Ce crédit est déjà annulé'], 422);
        $validator = Validator::make($request->all(), ['motif' => 'required|string|max:500']);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        try {
            DB::beginTransaction();
            ModificationCredit::create(['credit_id' => $creditBancaire->id, 'type' => 'annulation', 'date_modification' => now(), 'ancienne_valeur' => $creditBancaire->statut, 'nouvelle_valeur' => 'annule', 'motif' => $request->motif, 'user_id' => auth()->id()]);
            $creditBancaire->echeances()->where('statut', '!=', 'payee')->update(['statut' => 'annulee']);
            $creditBancaire->update(['statut' => 'annule']);
            Audit::log('update', 'credit', "Crédit annulé: {$creditBancaire->numero} - Motif: {$request->motif}", $creditBancaire->id);
            DB::commit();
            return response()->json(['message' => 'Crédit annulé avec succès', 'data' => new CreditBancaireResource($creditBancaire->load(['banque', 'echeances']))]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'annulation', 'error' => $e->getMessage()], 500);
        }
    }

    public function rembourser(RembourserCreditRequest $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $montantRembourse = $creditBancaire->remboursements()->sum('montant');
        $totalCredit = $creditBancaire->montant_emprunte + $creditBancaire->total_interets;
        $resteAPayer = $totalCredit - $montantRembourse;
        if ($request->montant > $resteAPayer) return response()->json(['message' => 'Le montant dépasse le reste à payer', 'reste_a_payer' => $resteAPayer], 422);

        try {
            DB::beginTransaction();
            $banqueId = $request->mode_paiement === 'Espèces' ? null : $creditBancaire->banque_id;
            $remboursement = RemboursementCredit::create(['credit_id' => $creditBancaire->id, 'echeance_id' => $request->echeance_id, 'banque_id' => $banqueId, 'montant' => $request->montant, 'date' => now(), 'reference' => $request->reference, 'notes' => $request->notes]);
            Audit::log('create', 'remboursement', "Remboursement: {$request->montant} pour crédit {$creditBancaire->numero}", $remboursement->id);
            DB::commit();
            return response()->json(new RemboursementCreditResource($remboursement), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors du remboursement', 'error' => $e->getMessage()], 500);
        }
    }

    public function echeances(CreditBancaire $creditBancaire): JsonResponse
    {
        return response()->json(EcheanceCreditResource::collection($creditBancaire->echeances()->with('remboursements')->orderBy('numero_echeance')->get()));
    }

    public function uploadDocument(Request $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $validator = Validator::make($request->all(), ['fichier' => 'required|file|max:10240', 'type' => 'required|string|max:100', 'description' => 'nullable|string|max:255']);
        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);
        $path = $request->file('fichier')->store('credits/' . $creditBancaire->id, 'public');
        $document = DocumentCredit::create(['credit_bancaire_id' => $creditBancaire->id, 'type' => $request->type, 'nom_fichier' => $request->file('fichier')->getClientOriginalName(), 'chemin' => $path, 'description' => $request->description, 'user_id' => auth()->id()]);
        return response()->json(new DocumentCreditResource($document), 201);
    }

    // === Délégation stats ===
    public function stats(Request $r): JsonResponse { return app(CreditBancaireStatsController::class)->stats($r); }
    public function dashboard(Request $r): JsonResponse { return app(CreditBancaireStatsController::class)->dashboard($r); }
    public function comparaison(Request $r): JsonResponse { return app(CreditBancaireStatsController::class)->comparaison($r); }

    private function generateNumero(): string
    {
        $year = date('Y');
        $lastCredit = CreditBancaire::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $lastCredit ? (intval(substr($lastCredit->numero, -4)) + 1) : 1;
        return sprintf('CRD-%s-%04d', $year, $nextNumber);
    }
}
