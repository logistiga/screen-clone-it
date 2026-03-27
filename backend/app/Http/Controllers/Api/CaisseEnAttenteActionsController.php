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
 * Actions sur la caisse en attente : décaisser, refuser
 */
class CaisseEnAttenteActionsController extends Controller
{
    protected CaisseOpsController $ops;
    protected CaisseCnvController $cnv;
    protected CaisseHorslbvController $horslbv;
    protected CaisseGarageController $garage;

    public function __construct()
    {
        $this->ops = new CaisseOpsController();
        $this->cnv = new CaisseCnvController();
        $this->horslbv = new CaisseHorslbvController();
        $this->garage = new CaisseGarageController();
    }

    /**
     * Décaisser une prime (créer sortie de caisse dans FAC)
     */
    public function decaisser(Request $request, string $primeId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'mode_paiement' => 'required|in:Espèces,Virement,Chèque,Mobile Money',
            'banque_id' => 'nullable|exists:banques,id',
            'reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'source' => 'nullable|in:OPS,CNV,HORSLBV,GARAGE',
            'categorie' => 'nullable|string|max:100',
            'montant' => 'nullable|numeric|min:1',
            'paiement_partiel' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $source = $request->get('source', 'OPS');

        try {
            $handler = match ($source) {
                'CNV' => $this->cnv,
                'HORSLBV' => $this->horslbv,
                'GARAGE' => $this->garage,
                default => $this->ops,
            };

            $prime = $handler->getPrimeForDecaissement($primeId);
            if (!$prime) {
                return response()->json(['message' => 'Prime non trouvée'], 404);
            }

            $refUnique = match ($source) {
                'CNV' => CaisseCnvController::buildRef($primeId),
                'HORSLBV' => CaisseHorslbvController::buildRef($primeId),
                'GARAGE' => CaisseGarageController::buildRef($primeId),
                default => CaisseOpsController::buildRef($primeId),
            };

            $categorie = $request->get('categorie') ?: match ($source) {
                'CNV' => CaisseCnvController::categorie(),
                'HORSLBV' => CaisseHorslbvController::categorie(),
                'GARAGE' => CaisseGarageController::categorie(),
                default => CaisseOpsController::categorie(),
            };

            $isPaiementPartiel = $request->boolean('paiement_partiel', false);
            $montantDecaisse = $isPaiementPartiel && $request->has('montant')
                ? (float) $request->montant
                : (float) $prime->montant;

            if ($montantDecaisse > $prime->montant) {
                return response()->json(['message' => 'Le montant dépasse le montant de la prime'], 422);
            }

            $numTranche = null;
            $existingPF = null;

            if ($isPaiementPartiel && $montantDecaisse < $prime->montant) {
                $existingPF = DB::table('paiements_fournisseurs')
                    ->where('source', $source)->where('source_id', $primeId)->first();

                if (!$existingPF) {
                    $pfId = DB::table('paiements_fournisseurs')->insertGetId([
                        'fournisseur' => $prime->beneficiaire ?? $prime->fournisseur_nom ?? 'N/A',
                        'reference' => $prime->numero_paiement ?? $refUnique,
                        'description' => ($source === 'GARAGE' ? "Achat Garage" : "Prime {$source}") . " - " . ($prime->beneficiaire ?? 'N/A'),
                        'montant_total' => $prime->montant,
                        'date_facture' => now()->toDateString(),
                        'source' => $source, 'source_id' => $primeId,
                        'created_by' => $request->user()?->id,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                    $existingPF = (object) ['id' => $pfId];
                }

                $totalDejaPaye = DB::table('tranches_paiement_fournisseur')
                    ->where('paiement_fournisseur_id', $existingPF->id)->sum('montant');

                $reste = $prime->montant - $totalDejaPaye;
                if ($montantDecaisse > $reste) {
                    return response()->json(['message' => "Le montant ({$montantDecaisse}) dépasse le reste à payer ({$reste})"], 422);
                }

                $numTranche = DB::table('tranches_paiement_fournisseur')
                    ->where('paiement_fournisseur_id', $existingPF->id)->count() + 1;

                $refUnique = $refUnique . '-T' . $numTranche;
            } else {
                if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
                    return response()->json(['message' => 'Cette prime a déjà été décaissée'], 422);
                }
            }

            DB::beginTransaction();

            $beneficiaire = $prime->beneficiaire ?? $prime->fournisseur_nom ?? 'N/A';
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            $description = ($source === 'GARAGE' ? "Achat Garage" : "Prime {$prime->type}") . " - {$beneficiaire}";
            if ($isPaiementPartiel) $description = "Avance - " . $description;
            $numeroPaiement = $prime->numero_paiement ?? null;
            if ($numeroPaiement) $description .= " - {$numeroPaiement}";

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie', 'categorie' => $categorie, 'montant' => $montantDecaisse,
                'description' => $description, 'beneficiaire' => $beneficiaire, 'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement, 'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque', 'banque_id' => $request->banque_id,
            ]);

            if ($isPaiementPartiel && $montantDecaisse < $prime->montant && isset($existingPF)) {
                DB::table('tranches_paiement_fournisseur')->insert([
                    'paiement_fournisseur_id' => $existingPF->id, 'montant' => $montantDecaisse,
                    'mode_paiement' => $request->mode_paiement, 'reference' => $request->reference,
                    'notes' => $request->notes, 'date_paiement' => now()->toDateString(),
                    'numero_tranche' => $numTranche ?? 1, 'mouvement_id' => $mouvement->id,
                    'created_by' => $request->user()?->id, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            Audit::log('create', 'decaissement_caisse_attente', "Décaissement prime {$source}: {$montantDecaisse} - {$beneficiaire}" . ($isPaiementPartiel ? ' (partiel)' : ''), $mouvement->id);
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
     * Refuser le décaissement d'une prime
     */
    public function refuser(Request $request, string $primeId): JsonResponse
    {
        return $this->doRefuser($request, $primeId, 'OPS');
    }

    public function refuserCnv(Request $request, string $primeId): JsonResponse
    {
        return $this->doRefuser($request, $primeId, 'CNV');
    }

    public function doRefuser(Request $request, string $primeId, string $source): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'motif' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reference = match ($source) {
            'CNV' => CaisseCnvController::buildRef($primeId),
            'HORSLBV' => CaisseHorslbvController::buildRef($primeId),
            'GARAGE' => CaisseGarageController::buildRef($primeId),
            default => CaisseOpsController::buildRef($primeId),
        };

        if (DB::table('primes_refusees')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cette prime a déjà été refusée'], 422);
        }
        if (DB::table('mouvements_caisse')->where('reference', $reference)->exists()) {
            return response()->json(['message' => 'Cette prime a déjà été décaissée, impossible de la refuser'], 422);
        }

        try {
            DB::table('primes_refusees')->insert([
                'prime_id' => $primeId, 'source' => $source, 'reference' => $reference,
                'motif' => $request->get('motif'), 'user_id' => $request->user()?->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);

            Audit::log('create', 'refus_decaissement', "Refus décaissement prime {$source}: {$primeId}", null);
            return response()->json(['message' => 'Prime refusée avec succès'], 200);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Erreur lors du refus', 'error' => $e->getMessage()], 500);
        }
    }
}
