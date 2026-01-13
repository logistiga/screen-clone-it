<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Optimisé: withCount/withSum au lieu de charger toutes les relations
        $query = Client::withCount(['devis', 'ordresTravail', 'factures'])
            ->withSum([
                'factures as factures_sum_ttc' => fn($q) => $q->whereNotIn('statut', ['annulee', 'Annulée']),
            ], 'montant_ttc')
            ->withSum('paiements as paiements_sum_montant', 'montant')
            ->selectRaw('clients.*, (SELECT COALESCE(SUM(solde_avoir), 0) FROM annulations WHERE client_id = clients.id AND avoir_genere = 1 AND solde_avoir > 0) as solde_avoirs');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        $clients = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(ClientResource::collection($clients)->response()->getData(true));
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $client = Client::create($request->validated());

        // Important: passer le modèle (pas l'id) pour éviter "Attempt to read property 'id' on int"
        Audit::log('create', 'client', "Client créé: {$client->nom}", $client);

        return response()->json(new ClientResource($client), 201);
    }

    public function show(Client $client): JsonResponse
    {
        $client->load([
            'devis' => fn($q) => $q->orderBy('created_at', 'desc'),
            'ordresTravail' => fn($q) => $q->orderBy('created_at', 'desc'),
            'factures' => fn($q) => $q->orderBy('created_at', 'desc'),
            'paiements' => fn($q) => $q->orderBy('created_at', 'desc'),
        ]);

        return response()->json(new ClientResource($client));
    }

    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        $client->update($request->validated());

        Audit::log('update', 'client', "Client modifié: {$client->nom}", $client);

        return response()->json(new ClientResource($client));
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
}
