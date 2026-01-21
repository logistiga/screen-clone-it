<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaiementRequest;
use App\Http\Requests\StorePaiementGlobalRequest;
use App\Http\Resources\PaiementResource;
use App\Http\Traits\SecureQueryParameters;
use App\Models\Paiement;
use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Models\NoteDebut;
use App\Models\Audit;
use App\Services\PaiementService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PaiementController extends Controller
{
    use SecureQueryParameters;

    protected PaiementService $paiementService;

    /**
     * Colonnes autorisées pour le tri
     */
    protected array $allowedSortColumns = [
        'id', 'date', 'montant', 'mode_paiement', 'reference', 'created_at', 'updated_at'
    ];

    /**
     * Modes de paiement autorisés
     */
    protected array $allowedModes = [
        'especes', 'cheque', 'virement', 'carte', 'mobile_money',
        'Espèces', 'Chèque', 'Virement', 'Carte bancaire', 'Mobile Money'
    ];

    public function __construct(PaiementService $paiementService)
    {
        $this->paiementService = $paiementService;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Paiement::with(['facture.client', 'ordre.client', 'noteDebut.client', 'client', 'banque']);

            // Recherche sécurisée
            $search = $this->validateSearchParameter($request);
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('reference', 'like', "%{$search}%")
                      ->orWhereHas('facture', fn($q) => $q->where('numero', 'like', "%{$search}%"))
                      ->orWhereHas('ordre', fn($q) => $q->where('numero', 'like', "%{$search}%"))
                      ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
                });
            }

            // Filtre par type validé
            if ($request->filled('type') && in_array($request->get('type'), ['facture', 'ordre', 'note_debut'])) {
                $type = $request->get('type');
                if ($type === 'facture') {
                    $query->whereNotNull('facture_id');
                } elseif ($type === 'ordre') {
                    $query->whereNotNull('ordre_id')->whereNull('facture_id');
                } elseif ($type === 'note_debut') {
                    $query->whereNotNull('note_debut_id');
                }
            }

            // IDs validés
            $noteDebutId = $this->validateId($request->get('note_debut_id'));
            if ($noteDebutId) {
                $query->where('note_debut_id', $noteDebutId);
            }

            if ($request->filled('mode_paiement') && in_array($request->get('mode_paiement'), $this->allowedModes)) {
                $query->where('mode_paiement', $request->get('mode_paiement'));
            }

            $clientId = $this->validateId($request->get('client_id'));
            if ($clientId) {
                $query->where('client_id', $clientId);
            }

            $factureId = $this->validateId($request->get('facture_id'));
            if ($factureId) {
                $query->where('facture_id', $factureId);
            }

            $ordreId = $this->validateId($request->get('ordre_id'));
            if ($ordreId) {
                $query->where('ordre_id', $ordreId);
            }

            $banqueId = $this->validateId($request->get('banque_id'));
            if ($banqueId) {
                $query->where('banque_id', $banqueId);
            }

            // Dates validées
            $dateRange = $this->validateDateRange($request);
            if ($dateRange['start']) {
                $query->where('date', '>=', $dateRange['start']);
            }
            if ($dateRange['end']) {
                $query->where('date', '<=', $dateRange['end']);
            }

            $paiements = $query->orderBy('date', 'desc')->paginate($request->get('per_page', 15));

            return response()->json(PaiementResource::collection($paiements)->response()->getData(true));

        } catch (\Throwable $e) {
            Log::error('Erreur listing paiements', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du chargement des paiements',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function store(StorePaiementRequest $request): JsonResponse
    {
        try {
            // Déterminer le document cible
            $clientId = $request->client_id;
            $resteAPayer = 0;
            $documentNumero = '';
            $document = null;

            if ($request->facture_id) {
                $document = Facture::with('paiements')->findOrFail($request->facture_id);
                $clientId = $document->client_id;
                $documentNumero = $document->numero;
            } elseif ($request->ordre_id) {
                $document = OrdreTravail::with('paiements')->findOrFail($request->ordre_id);
                $clientId = $document->client_id;
                $documentNumero = $document->numero;
            } elseif ($request->note_debut_id) {
                $note = NoteDebut::findOrFail($request->note_debut_id);
                // Calculer les paiements existants pour la note
                $montantPaye = Paiement::where('note_debut_id', $note->id)->sum('montant');
                $montantTotal = $note->montant_ttc ?? $note->montant_total ?? 0;
                $resteAPayer = $montantTotal - $montantPaye;
                $clientId = $note->client_id;
                $documentNumero = $note->numero;
            } else {
                return response()->json([
                    'message' => 'Vous devez spécifier une facture, un ordre de travail ou une note de début'
                ], 422);
            }

            // Appliquer l'exonération si demandée (pour factures et ordres uniquement)
            if ($document && ($request->has('exonere_tva') || $request->has('exonere_css'))) {
                $document->update([
                    'exonere_tva' => $request->boolean('exonere_tva'),
                    'exonere_css' => $request->boolean('exonere_css'),
                    'motif_exoneration' => $request->motif_exoneration,
                ]);
                
                // Recalculer les totaux avec les nouvelles exonérations
                $document->calculerTotaux();
                $document->refresh();
            }

            // Calculer le reste à payer APRÈS exonération
            if ($document) {
                $resteAPayer = $document->reste_a_payer;
            }

            if ($request->montant > $resteAPayer + 0.01) {
                return response()->json([
                    'message' => 'Le montant du paiement dépasse le reste à payer',
                    'reste_a_payer' => $resteAPayer
                ], 422);
            }

            $paiement = $this->paiementService->creer([
                'facture_id' => $request->facture_id,
                'ordre_id' => $request->ordre_id,
                'note_debut_id' => $request->note_debut_id,
                'client_id' => $clientId,
                'montant' => $request->montant,
                'mode_paiement' => $request->mode_paiement,
                'reference' => $request->reference,
                'banque_id' => $request->banque_id,
                'numero_cheque' => $request->numero_cheque,
                'date' => $request->date ?? now(),
                'notes' => $request->notes,
            ]);

            Audit::log('create', 'paiement', "Paiement enregistré: {$request->montant} pour {$documentNumero}", $paiement->id);

            return response()->json(new PaiementResource($paiement), 201);

        } catch (\Throwable $e) {
            Log::error('Erreur création paiement', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Paiement $paiement): JsonResponse
    {
        $paiement->load(['facture.client', 'ordre.client', 'client', 'banque']);
        return response()->json(new PaiementResource($paiement));
    }

    public function destroy(Paiement $paiement): JsonResponse
    {
        try {
            $this->paiementService->annuler($paiement);

            Audit::log('delete', 'paiement', "Paiement supprimé: {$paiement->montant}", $paiement->id);

            return response()->json(['message' => 'Paiement supprimé avec succès']);

        } catch (\Throwable $e) {
            Log::error('Erreur suppression paiement', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function paiementGlobal(StorePaiementGlobalRequest $request): JsonResponse
    {
        try {
            // Calculer le total des répartitions
            $totalFactures = collect($request->factures ?? [])->sum('montant');
            $totalOrdres = collect($request->ordres ?? [])->sum('montant');
            $totalRepartition = $totalFactures + $totalOrdres;

            if (abs($totalRepartition - $request->montant) > 0.01) {
                return response()->json([
                    'message' => 'La somme des montants répartis ne correspond pas au montant total',
                    'total_reparti' => $totalRepartition,
                    'montant_saisi' => $request->montant,
                ], 422);
            }

            $paiements = $this->paiementService->creerPaiementGlobal([
                'montant' => $request->montant,
                'client_id' => $request->client_id,
                'mode_paiement' => $request->mode_paiement,
                'reference' => $request->reference,
                'banque_id' => $request->banque_id,
                'numero_cheque' => $request->numero_cheque,
                'date' => $request->date ?? now(),
                'notes' => $request->notes,
                'factures' => collect($request->factures ?? [])->map(fn($f) => [
                    'id' => $f['id'],
                    'montant' => $f['montant']
                ])->toArray(),
                'ordres' => collect($request->ordres ?? [])->map(fn($o) => [
                    'id' => $o['id'],
                    'montant' => $o['montant']
                ])->toArray(),
            ]);

            Audit::log('create', 'paiement', "Paiement global enregistré: {$request->montant}", null);

            return response()->json([
                'message' => 'Paiement global enregistré avec succès',
                'paiements' => PaiementResource::collection($paiements),
                'nombre_documents' => count($paiements),
            ], 201);

        } catch (\Throwable $e) {
            Log::error('Erreur paiement global', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        try {
            $dateDebut = $request->get('date_debut', now()->startOfMonth());
            $dateFin = $request->get('date_fin', now()->endOfMonth());

            $stats = [
                'total' => Paiement::whereBetween('date', [$dateDebut, $dateFin])->sum('montant'),
                'nombre' => Paiement::whereBetween('date', [$dateDebut, $dateFin])->count(),
                'par_mode' => Paiement::whereBetween('date', [$dateDebut, $dateFin])
                    ->selectRaw('mode_paiement, SUM(montant) as total, COUNT(*) as nombre')
                    ->groupBy('mode_paiement')
                    ->get(),
                'par_jour' => Paiement::whereBetween('date', [$dateDebut, $dateFin])
                    ->selectRaw('DATE(date) as jour, SUM(montant) as total')
                    ->groupBy('jour')
                    ->orderBy('jour')
                    ->get(),
                'evolution_mensuelle' => Paiement::whereYear('date', date('Y'))
                    ->selectRaw('MONTH(date) as mois, SUM(montant) as total')
                    ->groupBy('mois')
                    ->orderBy('mois')
                    ->get(),
            ];

            return response()->json($stats);

        } catch (\Throwable $e) {
            Log::error('Erreur stats paiements', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du chargement des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
