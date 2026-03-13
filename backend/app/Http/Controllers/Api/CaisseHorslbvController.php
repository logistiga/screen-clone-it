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
            DB::connection('horslbv')->getPdo();
            return true;
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

            if (DB::table('mouvements_caisse')->where('reference', $refUnique)->exists()) {
                return response()->json(['message' => 'Cette fiche a déjà été décaissée'], 422);
            }

            DB::beginTransaction();

            $montantTotal = ($fiche->frais_route ?? 0)
                + ($fiche->carburant ?? 0)
                + ($fiche->logement ?? 0)
                + ($fiche->prime ?? 0);

            // Ajouter les charges supplémentaires si présentes
            if ($fiche->charges_supplementaires) {
                $charges = json_decode($fiche->charges_supplementaires, true);
                if (is_array($charges)) {
                    foreach ($charges as $charge) {
                        $montantTotal += floatval($charge['montant'] ?? 0);
                    }
                }
            }

            $beneficiaire = $fiche->numero_fiche ?? 'N/A';
            $isCaisse = in_array($request->mode_paiement, ['Espèces', 'Mobile Money']);

            $description = "Dépense Hors LBV - {$fiche->numero_fiche}";
            if ($fiche->numero_depense) {
                $description .= " - {$fiche->numero_depense}";
            }

            $mouvement = MouvementCaisse::create([
                'type' => 'Sortie',
                'categorie' => self::categorie(),
                'montant' => $montantTotal,
                'description' => $description,
                'beneficiaire' => $beneficiaire,
                'reference' => $refUnique,
                'mode_paiement' => $request->mode_paiement,
                'date' => now()->toDateString(),
                'source' => $isCaisse ? 'caisse' : 'banque',
                'banque_id' => $request->banque_id,
            ]);

            Audit::log('create', 'decaissement_caisse_attente', "Décaissement dépense HORSLBV: {$montantTotal} - {$fiche->numero_fiche}", $mouvement->id);

            DB::commit();

            return response()->json([
                'message' => 'Décaissement validé avec succès',
                'mouvement' => $mouvement,
            ], 201);
        } catch (\Exception $e) {
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

        $mouvements = DB::table('mouvements_caisse')
            ->where('categorie', self::categorie())
            ->whereIn('reference', $refs)
            ->get(['id', 'reference', 'date', 'mode_paiement'])
            ->keyBy('reference');

        $refusees = DB::table('primes_refusees')
            ->whereIn('reference', $refs)
            ->pluck('reference')
            ->toArray();

        return $primes->map(function ($prime) use ($mouvements, $refusees) {
            $ref = self::buildRef($prime->id);
            $mouvement = $mouvements[$ref] ?? null;
            $prime->decaisse = $mouvement !== null;
            $prime->mouvement_id = $mouvement?->id;
            $prime->date_decaissement = $mouvement?->date;
            $prime->mode_paiement_decaissement = $mouvement?->mode_paiement;
            $prime->refusee = in_array($ref, $refusees);
            return $prime;
        });
    }
}
