<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditBancaire;
use App\Models\EcheanceCredit;
use App\Models\RemboursementCredit;
use App\Models\DocumentCredit;
use App\Models\ModificationCredit;
use App\Models\MouvementCaisse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

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

        // Calculer les montants remboursés
        $credits->getCollection()->transform(function ($credit) {
            $credit->montant_rembourse = $credit->remboursements->sum('montant');
            $credit->reste_a_payer = $credit->montant_total - $credit->montant_rembourse;
            return $credit;
        });

        return response()->json($credits);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'banque_id' => 'required|exists:banques,id',
            'objet' => 'required|string|max:255',
            'montant_principal' => 'required|numeric|min:0.01',
            'taux_interet' => 'required|numeric|min:0',
            'duree_mois' => 'required|integer|min:1',
            'date_debut' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Calculer le montant total avec intérêts
            $montantInteret = $request->montant_principal * ($request->taux_interet / 100) * ($request->duree_mois / 12);
            $montantTotal = $request->montant_principal + $montantInteret;

            // Générer le numéro
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

            // Générer les échéances
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

            DB::commit();

            return response()->json($credit->load(['banque', 'echeances']), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(CreditBancaire $creditBancaire): JsonResponse
    {
        $creditBancaire->load(['banque', 'echeances', 'remboursements', 'documents', 'modifications']);
        
        $creditBancaire->montant_rembourse = $creditBancaire->remboursements->sum('montant');
        $creditBancaire->reste_a_payer = $creditBancaire->montant_total - $creditBancaire->montant_rembourse;
        $creditBancaire->prochaine_echeance = $creditBancaire->echeances()
            ->where('statut', 'En attente')
            ->orderBy('date_echeance')
            ->first();

        return response()->json($creditBancaire);
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

        // Enregistrer la modification
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

        return response()->json($creditBancaire->load(['banque', 'echeances']));
    }

    public function destroy(CreditBancaire $creditBancaire): JsonResponse
    {
        if ($creditBancaire->remboursements()->count() > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer un crédit avec des remboursements'
            ], 422);
        }

        $creditBancaire->echeances()->delete();
        $creditBancaire->documents()->delete();
        $creditBancaire->delete();

        return response()->json(['message' => 'Crédit supprimé avec succès']);
    }

    public function rembourser(Request $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'montant' => 'required|numeric|min:0.01',
            'mode_paiement' => 'required|in:Espèces,Chèque,Virement',
            'reference' => 'nullable|string|max:100',
            'echeance_id' => 'nullable|exists:echeances_credit,id',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

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

            // Mouvement de caisse si espèces
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

            // Mettre à jour l'échéance si spécifiée
            if ($request->echeance_id) {
                $echeance = EcheanceCredit::find($request->echeance_id);
                $echeance->update(['statut' => 'Payée', 'date_paiement' => now()]);
            }

            // Vérifier si le crédit est soldé
            $nouveauMontantRembourse = $montantRembourse + $request->montant;
            if ($nouveauMontantRembourse >= $creditBancaire->montant_total) {
                $creditBancaire->update(['statut' => 'Soldé']);
            }

            DB::commit();

            return response()->json($remboursement, 201);

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

        return response()->json($echeances);
    }

    public function uploadDocument(Request $request, CreditBancaire $creditBancaire): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fichier' => 'required|file|max:10240', // 10MB max
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

        return response()->json($document, 201);
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
