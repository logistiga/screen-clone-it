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
 * Contrôleur autonome pour les dépenses Hors Libreville
 * Lit la table fiches_depenses (validee = true) depuis la base horslbv
 */
class CaisseHorslbvController extends Controller
{
    public function isAvailable(): bool
    {
        try {
            $connection = DB::connection('horslbv');
            $connection->getPdo();

            return $connection->getSchemaBuilder()->hasTable('fiches_depenses');
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Liste des fiches de dépenses validées en attente de décaissement
     */
    public function index(Request $request): JsonResponse
    {
        try {
            if (!$this->isAvailable()) {
                return response()->json([
                    'data' => [],
                    'meta' => ['total' => 0, 'current_page' => 1, 'per_page' => 20, 'last_page' => 1],
                    'message' => 'Connexion Hors Libreville indisponible',
                ], 200);
            }

            $perPage = $request->get('per_page', 20);
            $page = $request->get('page', 1);
            $search = $request->get('search');
            $statut = $request->get('statut', 'all');

            $primes = $this->fetchPrimes($search);
            $primes = $this->attachDecaissementStatus($primes);

            if ($statut === 'a_decaisser') {
                $primes = $primes->filter(fn($p) => !$p->decaisse && !$p->refusee);
            } elseif ($statut === 'decaisse') {
                $primes = $primes->filter(fn($p) => $p->decaisse);
            } elseif ($statut === 'refusee') {
                $primes = $primes->filter(fn($p) => $p->refusee);
            }

            $primes = $primes->sortByDesc('created_at')->values();
            $total = $primes->count();
            $items = $primes->slice(($page - 1) * $perPage, $perPage)->values();

            return response()->json([
                'data' => $items,
                'meta' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => $total,
                    'last_page' => max(1, ceil($total / $perPage)),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des dépenses Hors Libreville',
                'error' => $e->getMessage(),
                'data' => [],
                'meta' => ['total' => 0, 'current_page' => 1, 'per_page' => 20, 'last_page' => 1],
            ], 200);
        }
    }

    /**
     * Statistiques des dépenses Hors Libreville
     */
    public function stats(): JsonResponse
    {
        try {
            if (!$this->isAvailable()) {
                return response()->json([
                    'total_valide' => 0,
                    'nombre_primes' => 0,
                    'total_a_decaisser' => 0,
                    'nombre_a_decaisser' => 0,
                    'deja_decaissees' => 0,
                    'total_decaisse' => 0,
                    'message' => 'Connexion Hors Libreville indisponible',
                ]);
            }

            $allPrimes = $this->fetchStats();

            $refs = $allPrimes->pluck('ref')->toArray();
            $decaisseesRefs = [];
            if (!empty($refs)) {
                $decaisseesRefs = DB::table('mouvements_caisse')
                    ->where('categorie', self::categorie())
                    ->whereIn('reference', $refs)
                    ->pluck('reference')
                    ->toArray();
            }

            $aDecaisser = $allPrimes->filter(fn($p) => !in_array($p->ref, $decaisseesRefs));
            $dejaDecaissees = $allPrimes->filter(fn($p) => in_array($p->ref, $decaisseesRefs));

            return response()->json([
                'total_valide' => $allPrimes->sum('montant'),
                'nombre_primes' => $allPrimes->count(),
                'total_a_decaisser' => $aDecaisser->sum('montant'),
                'nombre_a_decaisser' => $aDecaisser->count(),
                'deja_decaissees' => $dejaDecaissees->count(),
                'total_decaisse' => $dejaDecaissees->sum('montant'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'total_valide' => 0,
                'nombre_primes' => 0,
                'total_a_decaisser' => 0,
                'nombre_a_decaisser' => 0,
                'deja_decaissees' => 0,
                'total_decaisse' => 0,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Décaisser une fiche de dépense Hors Libreville
     */
    public function decaisser(Request $request, string $primeId): JsonResponse
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

        if (!$this->isAvailable()) {
            return response()->json(['message' => 'Connexion Hors Libreville indisponible'], 503);
        }

        try {
            $fiche = DB::connection('horslbv')->table('fiches_depenses')->where('id', $primeId)->first();

            if (!$fiche) {
                return response()->json(['message' => 'Fiche de dépense non trouvée'], 404);
            }

            if (!$fiche->validee) {
                return response()->json(['message' => "Cette fiche n'est pas encore validée"], 422);
            }

            $refUnique = self::buildRef($primeId);
            $categorie = $request->get('categorie') ?: self::categorie();

            $montantTotal = ($fiche->frais_route ?? 0)
                + ($fiche->carburant ?? 0)
                + ($fiche->logement ?? 0)
                + ($fiche->prime ?? 0);

            if ($fiche->charges_supplementaires) {
                $charges = json_decode($fiche->charges_supplementaires, true);
                if (is_array($charges)) {
                    foreach ($charges as $charge) {
                        $montantTotal += floatval($charge['montant'] ?? 0);
                    }
                }
            }

            $isPaiementPartiel = $request->boolean('paiement_partiel', false);
            $montantDecaisse = $isPaiementPartiel && $request->has('montant')
                ? (float) $request->montant
                : (float) $montantTotal;

            if ($montantDecaisse > $montantTotal) {
                return response()->json(['message' => 'Le montant dépasse le montant total de la fiche'], 422);
            }

            $numTranche = null;
            $existingPF = null;

            if ($isPaiementPartiel && $montantDecaisse < $montantTotal) {
                $existingPF = DB::table('paiements_fournisseurs')
                    ->where('source', 'HORSLBV')->where('source_id', $primeId)->first();

                if (!$existingPF) {
                    $pfId = DB::table('paiements_fournisseurs')->insertGetId([
                        'fournisseur' => $fiche->numero_fiche ?? 'N/A',
                        'reference' => $refUnique,
                        'description' => "Dépense Hors LBV - " . ($fiche->numero_fiche ?? 'N/A'),
                        'montant_total' => $montantTotal,
                        'date_facture' => now()->toDateString(),
                        'source' => 'HORSLBV', 'source_id' => $primeId,
                        'created_by' => $request->user()?->id,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                    $existingPF = (object) ['id' => $pfId];
                }

                $totalDejaPaye = DB::table('tranches_paiement_fournisseur')
                    ->where('paiement_fournisseur_id', $existingPF->id)->sum('montant');
                $reste = $montantTotal - $totalDejaPaye;
                if ($montantDecaisse > $reste) {
                    return response()->json(['message' => "Le montant ({$montantDecaisse}) dépasse le reste à payer ({$reste})"], 422);
                }

                $numTranche = DB::table('tranches_paiement_fournisseur')
                    ->where('paiement_fournisseur_id', $existingPF->id)->count() + 1;
                $refUnique .= '-T' . $numTranche;
            } else {
                if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
                    return response()->json(['message' => 'Cette fiche a déjà été décaissée'], 422);
                }
            }

            DB::beginTransaction();

            $beneficiaire = $fiche->numero_fiche ?? 'N/A';
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            $description = "Dépense Hors LBV - {$fiche->numero_fiche}";
            if ($isPaiementPartiel) $description = "Avance - " . $description;
            if ($fiche->numero_depense) $description .= " - {$fiche->numero_depense}";

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

            if ($isPaiementPartiel && $montantDecaisse < $montantTotal && isset($existingPF)) {
                DB::table('tranches_paiement_fournisseur')->insert([
                    'paiement_fournisseur_id' => $existingPF->id, 'montant' => $montantDecaisse,
                    'mode_paiement' => $request->mode_paiement, 'reference' => $request->reference,
                    'notes' => $request->notes, 'date_paiement' => now()->toDateString(),
                    'numero_tranche' => $numTranche ?? 1, 'mouvement_id' => $mouvement->id,
                    'created_by' => $request->user()?->id, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }

            Audit::log('create', 'decaissement_caisse_attente', "Décaissement dépense HORSLBV: {$montantDecaisse} - {$fiche->numero_fiche}" . ($isPaiementPartiel ? ' (partiel)' : ''), $mouvement->id);

            DB::commit();

            return response()->json([
                'message' => $isPaiementPartiel ? 'Avance enregistrée avec succès' : 'Décaissement validé avec succès',
                'mouvement' => $mouvement,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors du décaissement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Refuser une fiche (délègue à l'orchestrateur)
     */
    public function refuser(Request $request, string $primeId): JsonResponse
    {
        $controller = new CaisseEnAttenteController();
        return $controller->doRefuser($request, $primeId, 'HORSLBV');
    }

    // ── Helpers publics ──

    public function fetchPrimes(?string $search = null): \Illuminate\Support\Collection
    {
        $query = DB::connection('horslbv')
            ->table('fiches_depenses')
            ->select([
                'id',
                'operation_id',
                'numero_fiche',
                'numero_depense',
                'version',
                'frais_route',
                'carburant',
                'logement',
                'prime',
                'gasoil_litres',
                'charges_supplementaires',
                'note',
                'validee',
                'validated_at',
                'created_at',
            ])
            ->where('validee', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_fiche', 'like', "%{$search}%")
                  ->orWhere('numero_depense', 'like', "%{$search}%")
                  ->orWhere('note', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('validated_at', 'desc')->get()->map(function ($f) {
            $montant = ($f->frais_route ?? 0) + ($f->carburant ?? 0) + ($f->logement ?? 0) + ($f->prime ?? 0);

            if ($f->charges_supplementaires) {
                $charges = json_decode($f->charges_supplementaires, true);
                if (is_array($charges)) {
                    foreach ($charges as $charge) {
                        $montant += floatval($charge['montant'] ?? 0);
                    }
                }
            }

            return (object) [
                'id' => $f->id,
                'type' => 'Dépense',
                'beneficiaire' => $f->numero_fiche,
                'responsable' => null,
                'montant' => $montant,
                'payee' => true,
                'reference_paiement' => $f->numero_depense,
                'numero_paiement' => $f->numero_fiche,
                'paiement_valide' => true,
                'statut' => 'validee',
                'camion_plaque' => null,
                'parc' => null,
                'responsable_nom' => null,
                'prestataire_nom' => null,
                'created_at' => $f->created_at,
                'source' => 'HORSLBV',
                'date_paiement' => $f->validated_at,
                // HORSLBV-specific
                'numero_fiche' => $f->numero_fiche,
                'numero_depense' => $f->numero_depense,
                'frais_route' => $f->frais_route,
                'carburant' => $f->carburant,
                'logement' => $f->logement,
                'prime_chauffeur' => $f->prime,
                'gasoil_litres' => $f->gasoil_litres,
                'note' => $f->note,
            ];
        });
    }

    public function fetchStats(): \Illuminate\Support\Collection
    {
        return DB::connection('horslbv')
            ->table('fiches_depenses')
            ->where('validee', true)
            ->get(['id', 'frais_route', 'carburant', 'logement', 'prime', 'charges_supplementaires'])
            ->map(function ($f) {
                $montant = ($f->frais_route ?? 0) + ($f->carburant ?? 0) + ($f->logement ?? 0) + ($f->prime ?? 0);
                if ($f->charges_supplementaires) {
                    $charges = json_decode($f->charges_supplementaires, true);
                    if (is_array($charges)) {
                        foreach ($charges as $charge) {
                            $montant += floatval($charge['montant'] ?? 0);
                        }
                    }
                }
                return (object) ['id' => $f->id, 'montant' => $montant, 'ref' => self::buildRef($f->id)];
            });
    }

    public static function buildRef($id): string
    {
        return "HORSLBV-DEPENSE-{$id}";
    }

    public static function categorie(): string
    {
        return 'Dépense hors Libreville';
    }

    public function getPrimeForDecaissement($primeId): ?object
    {
        $fiche = DB::connection('horslbv')->table('fiches_depenses')->where('id', $primeId)->first();
        if ($fiche) {
            $montant = ($fiche->frais_route ?? 0) + ($fiche->carburant ?? 0) + ($fiche->logement ?? 0) + ($fiche->prime ?? 0);
            if ($fiche->charges_supplementaires) {
                $charges = json_decode($fiche->charges_supplementaires, true);
                if (is_array($charges)) {
                    foreach ($charges as $charge) {
                        $montant += floatval($charge['montant'] ?? 0);
                    }
                }
            }
            $fiche->montant = $montant;
            $fiche->beneficiaire = $fiche->numero_fiche;
            $fiche->type = 'Dépense HORSLBV';
            $fiche->numero_paiement = $fiche->numero_fiche;
        }
        return $fiche;
    }

    // ── Private helpers ──

    private function attachDecaissementStatus(\Illuminate\Support\Collection $primes): \Illuminate\Support\Collection
    {
        if ($primes->isEmpty()) return $primes;

        $refs = $primes->map(fn($p) => self::buildRef($p->id))->toArray();

        // Fetch exact references AND partial payment references (e.g. HORSLBV-DEPENSE-123-T1)
        $allMouvements = DB::table('mouvements_caisse')
            ->where('categorie', self::categorie())
            ->where(function ($q) use ($refs) {
                $q->whereIn('reference', $refs);
                foreach ($refs as $ref) {
                    $q->orWhere('reference', 'like', $ref . '-T%');
                }
            })
            ->get(['id', 'reference', 'date', 'mode_paiement', 'montant']);

        // Group mouvements by base reference
        $mouvementsByBase = [];
        foreach ($allMouvements as $m) {
            // Extract base ref (remove -T1, -T2 suffix)
            $baseRef = preg_replace('/-T\d+$/', '', $m->reference);
            if (!isset($mouvementsByBase[$baseRef])) {
                $mouvementsByBase[$baseRef] = ['mouvements' => collect(), 'total_paye' => 0];
            }
            $mouvementsByBase[$baseRef]['mouvements']->push($m);
            $mouvementsByBase[$baseRef]['total_paye'] += $m->montant;
        }

        // Check paiements_fournisseurs for partial payment tracking
        $pfRecords = DB::table('paiements_fournisseurs')
            ->where('source', 'HORSLBV')
            ->whereIn('source_id', $primes->pluck('id')->toArray())
            ->get(['id', 'source_id', 'montant_total'])
            ->keyBy('source_id');

        $refusees = DB::table('primes_refusees')
            ->whereIn('reference', $refs)
            ->pluck('reference')
            ->toArray();

        return $primes->map(function ($prime) use ($mouvementsByBase, $pfRecords, $refusees) {
            $ref = self::buildRef($prime->id);
            $data = $mouvementsByBase[$ref] ?? null;
            $pf = $pfRecords[$prime->id] ?? null;

            if ($data) {
                $lastMouvement = $data['mouvements']->sortByDesc('date')->first();
                $totalPaye = $data['total_paye'];

                // Fully paid: exact match OR total tranches >= montant
                $prime->decaisse = ($totalPaye >= $prime->montant);
                $prime->mouvement_id = $lastMouvement->id;
                $prime->date_decaissement = $lastMouvement->date;
                $prime->mode_paiement_decaissement = $lastMouvement->mode_paiement;
                $prime->total_paye = $totalPaye;
                $prime->reste_a_payer = max(0, $prime->montant - $totalPaye);
                $prime->nb_tranches = $data['mouvements']->count();
            } else {
                $prime->decaisse = false;
                $prime->mouvement_id = null;
                $prime->date_decaissement = null;
                $prime->mode_paiement_decaissement = null;
                $prime->total_paye = 0;
                $prime->reste_a_payer = $prime->montant;
                $prime->nb_tranches = 0;
            }

            $prime->refusee = in_array($ref, $refusees);
            $prime->paiement_fournisseur_id = $pf->id ?? null;
            return $prime;
        });
    }
}
