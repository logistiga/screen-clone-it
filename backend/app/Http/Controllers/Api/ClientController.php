<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Http\Traits\SecureQueryParameters;
use App\Models\Client;
use App\Models\Contact;
use App\Models\Audit;
use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ClientController extends Controller
{
    use SecureQueryParameters;

    /**
     * Colonnes autorisées pour le tri
     */
    protected array $allowedSortColumns = [
        'id', 'nom', 'email', 'telephone', 'type', 'created_at', 'updated_at'
    ];

    /**
     * Filtres autorisés
     */
    protected array $allowedFilters = [
        'type' => ['type' => 'enum', 'values' => ['Particulier', 'Société']],
    ];

    public function index(Request $request): JsonResponse
    {
        // Optimisé: withCount/withSum au lieu de charger toutes les relations
        $query = Client::withCount(['devis', 'ordresTravail', 'factures', 'contacts'])
            ->withSum([
                'factures as factures_sum_ttc' => fn($q) => $q->whereNotIn('statut', ['annulee', 'Annulée']),
            ], 'montant_ttc')
            ->withSum('paiements as paiements_sum_montant', 'montant')
            ->selectRaw('clients.*, (SELECT COALESCE(SUM(solde_avoir), 0) FROM annulations WHERE client_id = clients.id AND avoir_genere = 1 AND solde_avoir > 0) as solde_avoirs');

        // Recherche sécurisée
        $search = $this->validateSearchParameter($request);
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        // Filtre type validé
        if ($request->filled('type') && in_array($request->get('type'), ['Particulier', 'Société'])) {
            $query->where('type', $request->get('type'));
        }

        // Tri sécurisé
        $sort = $this->validateSortParameters($request, $this->allowedSortColumns);
        
        // Pagination sécurisée (limite augmentée pour les sélecteurs/combobox)
        $pagination = $this->validatePaginationParameters($request, 15, 500);
        
        $clients = $query->orderBy($sort['column'], $sort['direction'])
            ->paginate($pagination['per_page']);

        return response()->json(ClientResource::collection($clients)->response()->getData(true));
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();
            $contacts = $data['contacts'] ?? [];
            unset($data['contacts']);

            $client = Client::create($data);

            // Créer les contacts
            foreach ($contacts as $contactData) {
                $client->contacts()->create($contactData);
            }

            $client->load('contacts');

            Audit::log('create', 'client', "Client créé: {$client->nom}", $client);

            return response()->json(new ClientResource($client), 201);
        });
    }

    public function show(Client $client): JsonResponse
    {
        $client->load([
            'contacts' => fn($q) => $q->orderBy('est_principal', 'desc')->orderBy('nom'),
            'devis' => fn($q) => $q->orderBy('created_at', 'desc'),
            'ordresTravail' => fn($q) => $q->orderBy('created_at', 'desc'),
            'factures' => fn($q) => $q->orderBy('created_at', 'desc'),
            'paiements' => fn($q) => $q->orderBy('created_at', 'desc'),
        ]);

        return response()->json(new ClientResource($client));
    }

    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        return DB::transaction(function () use ($request, $client) {
            $data = $request->validated();
            $contacts = $data['contacts'] ?? null;
            unset($data['contacts']);

            $client->update($data);

            // Mise à jour des contacts si fournis
            if ($contacts !== null) {
                $existingIds = [];
                
                foreach ($contacts as $contactData) {
                    if (isset($contactData['id'])) {
                        // Mise à jour d'un contact existant
                        $contact = $client->contacts()->find($contactData['id']);
                        if ($contact) {
                            $contact->update($contactData);
                            $existingIds[] = $contact->id;
                        }
                    } else {
                        // Création d'un nouveau contact
                        $newContact = $client->contacts()->create($contactData);
                        $existingIds[] = $newContact->id;
                    }
                }

                // Supprimer les contacts non présents dans la requête
                $client->contacts()->whereNotIn('id', $existingIds)->delete();
            }

            $client->load('contacts');

            Audit::log('update', 'client', "Client modifié: {$client->nom}", $client);

            return response()->json(new ClientResource($client));
        });
    }

    public function destroy(Client $client): JsonResponse
    {
        // Accepte tous les variants de statuts (majuscules, minuscules, snake_case)
        $facturesImpayees = $client->factures()
            ->whereNotIn('statut', ['Payée', 'payee', 'Annulée', 'annulee'])
            ->count();
        
        if ($facturesImpayees > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce client car il a des factures impayées'
            ], 422);
        }

        Audit::log('delete', 'client', "Client supprimé: {$client->nom}", $client);

        $client->delete();

        return response()->json(['message' => 'Client supprimé avec succès']);
    }

    public function stats(Client $client): JsonResponse
    {
        $stats = [
            'total_devis' => $client->devis()->count(),
            'total_ordres' => $client->ordresTravail()->count(),
            'total_factures' => $client->factures()->count(),
            'montant_total_facture' => $client->factures()->sum('montant_ttc'),
            'montant_total_paye' => $client->paiements()->sum('montant'),
            'solde_restant' => $client->factures()->sum('montant_ttc') - $client->paiements()->sum('montant'),
            'factures_par_statut' => [
                'brouillon' => $client->factures()->where('statut', 'Brouillon')->count(),
                'envoyee' => $client->factures()->where('statut', 'Envoyée')->count(),
                'payee' => $client->factures()->where('statut', 'Payée')->count(),
                'annulee' => $client->factures()->where('statut', 'Annulée')->count(),
            ],
        ];

        return response()->json($stats);
    }

    /**
     * Statistiques globales de tous les clients
     */
    public function globalStats(Request $request): JsonResponse
    {
        $dateDebut = $request->get('date_debut');
        $dateFin = $request->get('date_fin');

        // Totaux généraux
        $totalClients = Client::count();
        $clientsParticuliers = Client::where('type', 'Particulier')->count();
        $clientsEntreprises = Client::where('type', 'Entreprise')->count();
        
        // Nouveaux clients (ce mois)
        $nouveauxClientsMois = Client::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Statistiques financières
        $facturesQuery = Facture::whereNotIn('statut', ['annulee', 'Annulée']);
        if ($dateDebut) {
            $facturesQuery->whereDate('date', '>=', $dateDebut);
        }
        if ($dateFin) {
            $facturesQuery->whereDate('date', '<=', $dateFin);
        }

        $chiffreAffaires = (clone $facturesQuery)->sum('montant_ttc');
        $montantEncaisse = (clone $facturesQuery)->sum('montant_paye');
        $creancesTotales = $chiffreAffaires - $montantEncaisse;

        // Clients avec solde > 0 (créances)
        $clientsAvecCreances = Client::whereHas('factures', function ($q) {
            $q->whereNotIn('statut', ['Payée', 'payee', 'Annulée', 'annulee']);
        })->count();

        // Top 5 clients par CA
        $topClients = Client::select('clients.id', 'clients.nom', 'clients.type')
            ->join('factures', 'clients.id', '=', 'factures.client_id')
            ->whereNotIn('factures.statut', ['annulee', 'Annulée'])
            ->groupBy('clients.id', 'clients.nom', 'clients.type')
            ->selectRaw('SUM(factures.montant_ttc) as total_ca')
            ->orderByDesc('total_ca')
            ->limit(5)
            ->get();

        // Évolution mensuelle (12 derniers mois)
        $evolutionMensuelle = [];
        for ($i = 11; $i >= 0; $i--) {
            $mois = now()->subMonths($i);
            $count = Client::whereYear('created_at', $mois->year)
                ->whereMonth('created_at', $mois->month)
                ->count();
            $evolutionMensuelle[] = [
                'mois' => $mois->format('Y-m'),
                'label' => $mois->translatedFormat('M Y'),
                'nouveaux_clients' => $count,
            ];
        }

        // Répartition par type
        $repartitionType = [
            ['type' => 'Particulier', 'count' => $clientsParticuliers, 'percentage' => $totalClients > 0 ? round(($clientsParticuliers / $totalClients) * 100, 1) : 0],
            ['type' => 'Entreprise', 'count' => $clientsEntreprises, 'percentage' => $totalClients > 0 ? round(($clientsEntreprises / $totalClients) * 100, 1) : 0],
        ];

        return response()->json([
            'totaux' => [
                'total_clients' => $totalClients,
                'particuliers' => $clientsParticuliers,
                'entreprises' => $clientsEntreprises,
                'nouveaux_ce_mois' => $nouveauxClientsMois,
                'clients_avec_creances' => $clientsAvecCreances,
            ],
            'financier' => [
                'chiffre_affaires' => round($chiffreAffaires, 2),
                'montant_encaisse' => round($montantEncaisse, 2),
                'creances_totales' => round($creancesTotales, 2),
            ],
            'top_clients' => $topClients,
            'evolution_mensuelle' => $evolutionMensuelle,
            'repartition_type' => $repartitionType,
        ]);
    }
}
