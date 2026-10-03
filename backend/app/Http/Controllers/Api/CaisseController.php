<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMouvementCaisseRequest;
use App\Http\Resources\MouvementCaisseResource;
use App\Http\Traits\SecureQueryParameters;
use App\Models\MouvementCaisse;
use App\Models\Audit;
use App\Services\CaisseService;
use App\Services\Caisse\CaisseMouvementService;
use App\Services\Caisse\SoldeInsuffisantException;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CaisseController extends Controller
{
    use SecureQueryParameters;

    protected CaisseService $caisseService;

    /**
     * Colonnes autorisées pour le tri
     */
    protected array $allowedSortColumns = [
        'id', 'date', 'montant', 'type', 'source', 'categorie', 'created_at'
    ];

    /**
     * Types et sources autorisés
     */
    protected array $allowedTypes = ['Entrée', 'Sortie', 'entree', 'sortie'];
    protected array $allowedSources = ['caisse', 'banque'];

    public function __construct(CaisseService $caisseService)
    {
        $this->caisseService = $caisseService;
    }

    public function index(Request $request): JsonResponse
    {
        // Filtres validés
        $filters = [
            'type' => $request->filled('type') && in_array($request->get('type'), $this->allowedTypes) 
                ? $request->get('type') : null,
            'source' => $request->filled('source') && in_array($request->get('source'), $this->allowedSources)
                ? $request->get('source') : null,
            'banque_id' => $this->validateId($request->get('banque_id')),
            'date_debut' => null,
            'date_fin' => null,
        ];

        // Dates validées
        $dateRange = $this->validateDateRange($request);
        $filters['date_debut'] = $dateRange['start'];
        $filters['date_fin'] = $dateRange['end'];

        $mouvements = $this->caisseService->getMouvements($filters);

        // Recherche sécurisée
        $search = $this->validateSearchParameter($request);
        if ($search) {
            $mouvements->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('categorie', 'like', "%{$search}%");
            });
        }

        // Catégorie validée (string simple)
        $categorie = $this->validateSearchParameter($request, 'categorie');
        if ($categorie) {
            $mouvements->where('categorie', $categorie);
        }

        // Tri et pagination sécurisés
        $sort = $this->validateSortParameters($request, $this->allowedSortColumns, 'date', 'desc');
        $pagination = $this->validatePaginationParameters($request, 20);

        $mouvements = $mouvements->orderBy($sort['column'], $sort['direction'])
            ->paginate($pagination['per_page']);

        return response()->json(MouvementCaisseResource::collection($mouvements)->response()->getData(true));
    }

    public function store(StoreMouvementCaisseRequest $request): JsonResponse
    {
        $type = $request->type === 'Entrée' ? 'entree' : 'sortie';
        $data = [
            'montant' => $request->montant,
            'date' => $request->input('date') ?: now()->toDateString(),
            'description' => $request->description,
            'categorie' => $request->categorie,
            'source' => $request->source,
            'banque_id' => $request->source === 'banque' ? $request->banque_id : null,
            'beneficiaire' => $request->beneficiaire,
        ];

        try {
            $mouvement = $this->mouvementService->creer($type, $data);
        } catch (SoldeInsuffisantException $e) {
            return response()->json(['message' => $e->getMessage(), 'solde_actuel' => $e->soldeActuel], $e->status);
        } catch (\Throwable $e) {
            Log::error('Caisse store', ['error' => $e->getMessage()]);
            return response()->json(['message' => "Erreur lors de l'enregistrement du mouvement"], 422);
        }

        Audit::log('create', 'caisse', "Mouvement {$request->source}: {$request->type} - {$request->montant}", $mouvement->id);
        $this->diffuser($type, (float) $request->montant, (string) ($request->description ?? ''), (string) $request->source);

        return response()->json(new MouvementCaisseResource($mouvement), 201);
    }

    public function show(MouvementCaisse $mouvement): JsonResponse
    {
        $mouvement->load(['user', 'banque']);
        return response()->json(new MouvementCaisseResource($mouvement));
    }

    public function update(Request $request, MouvementCaisse $mouvement): JsonResponse
    {
        if ($mouvement->paiement_id) {
            return response()->json([
                'message' => 'Ce mouvement est lié à un paiement et ne peut pas être modifié'
            ], 422);
        }

        $validated = $request->validate([
            'montant' => 'sometimes|numeric|min:0.01|max:999999999.99',
            'description' => 'sometimes|string|max:500',
            'categorie' => 'sometimes|string|max:100',
            'beneficiaire' => 'nullable|string|max:255',
        ]);

        try {
            $mouvement = $this->mouvementService->modifier($mouvement, $validated);
        } catch (SoldeInsuffisantException $e) {
            return response()->json(['message' => $e->getMessage() . ' pour cette modification', 'solde_actuel' => $e->soldeActuel], $e->status);
        }

        Audit::log('update', 'caisse', "Mouvement modifié: {$mouvement->type} - {$mouvement->montant}", $mouvement->id);

        return response()->json(new MouvementCaisseResource($mouvement));
    }

    public function destroy(Request $request, MouvementCaisse $mouvement): JsonResponse
    {
        if ($mouvement->paiement_id) {
            return response()->json([
                'message' => 'Ce mouvement est lié à un paiement et ne peut pas être supprimé directement'
            ], 422);
        }

        Audit::log('delete', 'caisse', "Mouvement supprimé: {$mouvement->type} - {$mouvement->montant} ({$mouvement->description})", $mouvement->id);
        $this->mouvementService->supprimer($mouvement, $request->user()?->id);

        return response()->json(['message' => 'Mouvement supprimé avec succès']);
    }

    /** La diffusion temps réel ne doit jamais faire échouer l'opération. */
    private function diffuser(string $type, float $montant, string $description, string $source): void
    {
        try {
            event(new \App\Events\CaisseMouvement($type, $montant, $description, $source));
        } catch (\Throwable $e) {
            Log::warning('Diffusion caisse impossible', ['error' => $e->getMessage()]);
        }
    }

    public function solde(): JsonResponse
    {
        $soldes = $this->caisseService->getSoldeGlobal();

        return response()->json([
            'solde' => $soldes['caisse'],
            'total_entrees' => MouvementCaisse::where('type', 'entree')->sum('montant'),
            'total_sorties' => MouvementCaisse::where('type', 'sortie')->sum('montant'),
            'solde_banques' => $soldes['banques'],
            'solde_total' => $soldes['total'],
        ]);
    }

    public function soldeJour(Request $request): JsonResponse
    {
        $date = $request->get('date', now()->toDateString());

        $entrees = MouvementCaisse::where('source', 'caisse')
            ->where('type', 'entree')
            ->whereDate('date', $date)
            ->sum('montant');

        $sorties = MouvementCaisse::where('source', 'caisse')
            ->where('type', 'sortie')
            ->whereDate('date', $date)
            ->sum('montant');

        return response()->json([
            'entrees' => round((float) $entrees, 2),
            'sorties' => round((float) $sorties, 2),
            'solde' => round((float) ($entrees - $sorties), 2),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $stats = $this->caisseService->getStatistiques([
            'date_debut' => $request->get('date_debut', now()->startOfMonth()),
            'date_fin' => $request->get('date_fin', now()->endOfMonth()),
        ]);

        return response()->json($stats);
    }

    public function categories(): JsonResponse
    {
        $categories = [
            'Entrée' => [
                'Paiement facture',
                'Avance client',
                'Remboursement',
                'Autre entrée',
            ],
            'Sortie' => [
                'Frais de port',
                'Frais de douane',
                'Transport',
                'Manutention',
                'Salaires',
                'Carburant',
                'Fournitures',
                'Entretien',
                'Prime représentant',
                'Autre sortie',
            ],
        ];

        return response()->json($categories);
    }
}
