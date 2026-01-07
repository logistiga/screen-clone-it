<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Client::with(['devis', 'ordresTravail', 'factures', 'paiements']);

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

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:50',
            'adresse' => 'nullable|string',
            'type' => 'required|in:Particulier,Entreprise',
            'nif' => 'nullable|string|max:100',
            'rccm' => 'nullable|string|max:100',
            'contact_principal' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $client = Client::create($request->all());

        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        $client->load([
            'devis' => fn($q) => $q->orderBy('created_at', 'desc'),
            'ordresTravail' => fn($q) => $q->orderBy('created_at', 'desc'),
            'factures' => fn($q) => $q->orderBy('created_at', 'desc'),
            'paiements' => fn($q) => $q->orderBy('created_at', 'desc'),
        ]);

        // Calculer les statistiques
        $client->total_facture = $client->factures->sum('montant_ttc');
        $client->total_paye = $client->paiements->sum('montant');
        $client->solde = $client->total_facture - $client->total_paye;

        return response()->json($client);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'telephone' => 'nullable|string|max:50',
            'adresse' => 'nullable|string',
            'type' => 'sometimes|required|in:Particulier,Entreprise',
            'nif' => 'nullable|string|max:100',
            'rccm' => 'nullable|string|max:100',
            'contact_principal' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $client->update($request->all());

        return response()->json($client);
    }

    public function destroy(Client $client): JsonResponse
    {
        // Vérifier s'il y a des factures impayées
        $facturesImpayees = $client->factures()->where('statut', '!=', 'Payée')->count();
        
        if ($facturesImpayees > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer ce client car il a des factures impayées'
            ], 422);
        }

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
