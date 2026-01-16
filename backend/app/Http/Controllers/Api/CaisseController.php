<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMouvementCaisseRequest;
use App\Http\Resources\MouvementCaisseResource;
use App\Http\Traits\SecureQueryParameters;
use App\Models\MouvementCaisse;
use App\Models\Audit;
use App\Services\CaisseService;
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
    protected array $allowedTypes = ['Entrée', 'Sortie'];
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
        try {
            // Vérifier le solde selon la source
            if ($request->type === 'Sortie') {
                if ($request->source === 'caisse') {
                    $solde = $this->caisseService->getSoldeCaisse();
                    if ($request->montant > $solde) {
                        return response()->json([
                            'message' => 'Solde caisse insuffisant',
                            'solde_actuel' => $solde
                        ], 422);
                    }
                } elseif ($request->source === 'banque' && $request->banque_id) {
                    $banque = \App\Models\Banque::find($request->banque_id);
                    if ($banque && $request->montant > $banque->solde) {
                        return response()->json([
                            'message' => 'Solde bancaire insuffisant',
                            'solde_actuel' => $banque->solde
                        ], 422);
                    }
                }
            }

            $data = [
                'montant' => $request->montant,
                'date' => now(),
                'description' => $request->description,
                'categorie' => $request->categorie,
                'source' => $request->source,
                'banque_id' => $request->source === 'banque' ? $request->banque_id : null,
                'beneficiaire' => $request->beneficiaire,
            ];

            $mouvement = $request->type === 'Entrée' 
                ? $this->caisseService->creerEntree($data)
                : $this->caisseService->creerSortie($data);

            Audit::log('create', 'caisse', "Mouvement {$request->source}: {$request->type} - {$request->montant}", $mouvement->id);

            return response()->json(new MouvementCaisseResource($mouvement), 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(MouvementCaisse $mouvement): JsonResponse
    {
        $mouvement->load(['user', 'banque']);
        return response()->json(new MouvementCaisseResource($mouvement));
    }

    public function destroy(MouvementCaisse $mouvement): JsonResponse
    {
        if ($mouvement->categorie === 'Paiement facture' && $mouvement->reference) {
            return response()->json([
                'message' => 'Ce mouvement est lié à un paiement et ne peut pas être supprimé directement'
            ], 422);
        }

        Audit::log('delete', 'caisse', "Mouvement supprimé: {$mouvement->type} - {$mouvement->montant}", $mouvement->id);

        $mouvement->delete();

        return response()->json(['message' => 'Mouvement supprimé avec succès']);
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
