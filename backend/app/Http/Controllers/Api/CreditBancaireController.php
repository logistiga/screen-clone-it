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
use App\Models\MouvementCaisse;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CreditBancaireController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CreditBancaire::with(['banque', 'echeances', 'remboursements']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhere('objet', 'like', "%{$search}%")
                  ->orWhereHas('banque', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->has('banque_id')) {
            $query->where('banque_id', $request->get('banque_id'));
        }

        $credits = $query->orderBy('date_debut', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(CreditBancaireResource::collection($credits)->response()->getData(true));
    }

    public function store(StoreCreditBancaireRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $montantInteret = $request->montant_principal * ($request->taux_interet / 100) * ($request->duree_mois / 12);
            $montantTotal = $request->montant_principal + $montantInteret;
            $numero = $this->generateNumero();

            $credit = CreditBancaire::create([
                'numero' => $numero,
                'banque_id' => $request->banque_id,
                'objet' => $request->objet,
                'montant_principal' => $request->montant_principal,
                'taux_interet' => $request->taux_interet,
                'montant_interet' => $montantInteret,
                'montant_total' => $montantTotal,
                'duree_mois' => $request->duree_mois,
                'date_debut' => $request->date_debut,
                'date_fin' => date('Y-m-d', strtotime($request->date_debut . " + {$request->duree_mois} months")),
                'notes' => $request->notes,
                'statut' => 'Actif',
            ]);

            $mensualite = $montantTotal / $request->duree_mois;
            for ($i = 1; $i <= $request->duree_mois; $i++) {
                EcheanceCredit::create([
                    'credit_bancaire_id' => $credit->id,
                    'numero_echeance' => $i,
                    'date_echeance' => date('Y-m-d', strtotime($request->date_debut . " + {$i} months")),
                    'montant' => $mensualite,
                    'statut' => 'En attente',
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
        $validator = Validator::make($request->all(), [
            'objet' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string',
            'statut' => 'sometimes|in:Actif,Soldé,En défaut',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->has('objet') || $request->has('notes')) {
            ModificationCredit::create([
                'credit_bancaire_id' => $creditBancaire->id,
                'type_modification' => 'Modification informations',
                'ancien_valeur' => json_encode($creditBancaire->only(['objet', 'notes'])),
                'nouveau_valeur' => json_encode($request->only(['objet', 'notes'])),
                'user_id' => auth()->id(),
            ]);
        }

        $creditBancaire->update($request->only(['objet', 'notes', 'statut']));

        Audit::log('update', 'credit', "Crédit modifié: {$creditBancaire->numero}", $creditBancaire->id);

        return response()->json(new CreditBancaireResource($creditBancaire->load(['banque', 'echeances'])));
    }

    public function destroy(CreditBancaire $creditBancaire): JsonResponse
    {
        if ($creditBancaire->remboursements()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer un crédit avec des remboursements'
            ], 422);
        }

        Audit::log('delete', 'credit', "Crédit supprimé: {$creditBancaire->numero}", $creditBancaire->id);

        $creditBancaire->echeances()->delete();
        $creditBancaire->documents()->delete();
        $creditBancaire->delete();

        return response()->json(['message' => 'Crédit supprimé avec succès']);
    }

    public function rembourser(RembourserCreditRequest $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $montantRembourse = $creditBancaire->remboursements()->sum('montant');
        $resteAPayer = $creditBancaire->montant_total - $montantRembourse;

        if ($request->montant > $resteAPayer) {
            return response()->json([
                'message' => 'Le montant dépasse le reste à payer',
                'reste_a_payer' => $resteAPayer
            ], 422);
        }

        try {
            DB::beginTransaction();

            $remboursement = RemboursementCredit::create([
                'credit_bancaire_id' => $creditBancaire->id,
                'echeance_id' => $request->echeance_id,
                'montant' => $request->montant,
                'mode_paiement' => $request->mode_paiement,
                'reference' => $request->reference,
                'date_remboursement' => now(),
                'notes' => $request->notes,
                'user_id' => auth()->id(),
            ]);

            if ($request->mode_paiement === 'Espèces') {
                MouvementCaisse::create([
                    'type' => 'Sortie',
                    'categorie' => 'Remboursement crédit',
                    'montant' => $request->montant,
                    'description' => "Remboursement crédit {$creditBancaire->numero}",
                    'reference' => $remboursement->id,
                    'date_mouvement' => now(),
                    'user_id' => auth()->id(),
                ]);
            }

            if ($request->echeance_id) {
                $echeance = EcheanceCredit::find($request->echeance_id);
                $echeance->update(['statut' => 'Payée', 'date_paiement' => now()]);
            }

            $nouveauMontantRembourse = $montantRembourse + $request->montant;
            if ($nouveauMontantRembourse >= $creditBancaire->montant_total) {
                $creditBancaire->update(['statut' => 'Soldé']);
            }

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
        $echeances = $creditBancaire->echeances()
            ->with('remboursements')
            ->orderBy('numero_echeance')
            ->get();

        return response()->json(EcheanceCreditResource::collection($echeances));
    }

    public function uploadDocument(Request $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fichier' => 'required|file|max:10240',
            'type' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('fichier')->store('credits/' . $creditBancaire->id, 'public');

        $document = DocumentCredit::create([
            'credit_bancaire_id' => $creditBancaire->id,
            'type' => $request->type,
            'nom_fichier' => $request->file('fichier')->getClientOriginalName(),
            'chemin' => $path,
            'description' => $request->description,
            'user_id' => auth()->id(),
        ]);

        return response()->json(new DocumentCreditResource($document), 201);
    }

    public function stats(Request $request): JsonResponse
    {
        $stats = [
            'total_credits_actifs' => CreditBancaire::where('statut', 'Actif')->sum('montant_total'),
            'total_rembourse' => RemboursementCredit::sum('montant'),
            'reste_global' => CreditBancaire::where('statut', 'Actif')->sum('montant_total') 
                - RemboursementCredit::whereHas('credit', fn($q) => $q->where('statut', 'Actif'))->sum('montant'),
            'echeances_en_retard' => EcheanceCredit::where('statut', 'En attente')
                ->where('date_echeance', '<', now())
                ->count(),
            'par_banque' => CreditBancaire::where('statut', 'Actif')
                ->with('banque')
                ->selectRaw('banque_id, SUM(montant_total) as total, COUNT(*) as nombre')
                ->groupBy('banque_id')
                ->get(),
        ];

        return response()->json($stats);
    }

    private function generateNumero(): string
    {
        $year = date('Y');
        $lastCredit = CreditBancaire::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $lastCredit ? (intval(substr($lastCredit->numero, -4)) + 1) : 1;
        return sprintf('CRD-%s-%04d', $year, $nextNumber);
    }
}
