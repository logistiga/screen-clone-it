<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFactureRequest;
use App\Http\Requests\UpdateFactureRequest;
use App\Http\Requests\AnnulerFactureRequest;
use App\Http\Resources\FactureResource;
use App\Models\Facture;
use App\Models\LigneFacture;
use App\Models\ConteneurFacture;
use App\Models\OperationConteneurFacture;
use App\Models\LotFacture;
use App\Models\Configuration;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FactureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Facture::with(['client', 'transitaire', 'ordreTravail', 'lignes', 'conteneurs.operations', 'lots', 'paiements']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhere('bl_numero', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->get('statut'));
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->get('client_id'));
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        if ($request->has('impayees')) {
            $query->whereIn('statut', ['Envoyée', 'Partiellement payée']);
        }

        $factures = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(FactureResource::collection($factures)->response()->getData(true));
    }

    public function store(StoreFactureRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $numero = $this->generateNumero();
            $tauxTva = Configuration::where('cle', 'taux_tva')->value('valeur') ?? 18;
            $tauxCss = Configuration::where('cle', 'taux_css')->value('valeur') ?? 1;

            $facture = Facture::create([
                'numero' => $numero,
                'client_id' => $request->client_id,
                'transitaire_id' => $request->transitaire_id,
                'ordre_travail_id' => $request->ordre_travail_id,
                'type_document' => $request->type_document,
                'date' => now(),
                'date_echeance' => $request->date_echeance ?? now()->addDays(30),
                'bl_numero' => $request->bl_numero,
                'navire' => $request->navire,
                'date_arrivee' => $request->date_arrivee,
                'notes' => $request->notes,
                'statut' => 'Brouillon',
                'taux_tva' => $tauxTva,
                'taux_css' => $tauxCss,
            ]);

            $this->createLignes($facture, $request->lignes ?? []);
            $this->createConteneurs($facture, $request->conteneurs ?? []);
            $this->createLots($facture, $request->lots ?? []);
            $this->calculerTotaux($facture);

            Audit::log('create', 'facture', "Facture créée: {$facture->numero}", $facture->id);

            DB::commit();

            return response()->json(new FactureResource($facture->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots'])), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Facture $facture): JsonResponse
    {
        $facture->load([
            'client', 'transitaire', 'ordreTravail', 'lignes', 
            'conteneurs.operations', 'conteneurs.armateur', 'lots', 'paiements'
        ]);

        return response()->json(new FactureResource($facture));
    }

    public function update(UpdateFactureRequest $request, Facture $facture): JsonResponse
    {
        if (in_array($facture->statut, ['Payée', 'Annulée'])) {
            return response()->json(['message' => 'Impossible de modifier cette facture'], 422);
        }

        try {
            DB::beginTransaction();

            $facture->update($request->only([
                'client_id', 'transitaire_id', 'type_document', 'date_echeance',
                'bl_numero', 'navire', 'date_arrivee', 'notes', 'statut'
            ]));

            if ($request->has('lignes')) {
                $facture->lignes()->delete();
                $this->createLignes($facture, $request->lignes);
            }

            if ($request->has('conteneurs')) {
                $facture->conteneurs()->each(fn($c) => $c->operations()->delete());
                $facture->conteneurs()->delete();
                $this->createConteneurs($facture, $request->conteneurs);
            }

            if ($request->has('lots')) {
                $facture->lots()->delete();
                $this->createLots($facture, $request->lots);
            }

            $this->calculerTotaux($facture);

            Audit::log('update', 'facture', "Facture modifiée: {$facture->numero}", $facture->id);

            DB::commit();

            return response()->json(new FactureResource($facture->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots'])));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Facture $facture): JsonResponse
    {
        if ($facture->paiements()->count() > 0) {
            return response()->json(['message' => 'Impossible de supprimer une facture avec des paiements'], 422);
        }

        Audit::log('delete', 'facture', "Facture supprimée: {$facture->numero}", $facture->id);

        $facture->conteneurs()->each(fn($c) => $c->operations()->delete());
        $facture->conteneurs()->delete();
        $facture->lignes()->delete();
        $facture->lots()->delete();
        $facture->delete();

        return response()->json(['message' => 'Facture supprimée avec succès']);
    }

    public function annuler(AnnulerFactureRequest $request, Facture $facture): JsonResponse
    {
        if ($facture->statut === 'Annulée') {
            return response()->json(['message' => 'Cette facture est déjà annulée'], 422);
        }

        try {
            DB::beginTransaction();

            \App\Models\Annulation::create([
                'facture_id' => $facture->id,
                'motif' => $request->motif,
                'user_id' => auth()->id(),
                'date_annulation' => now(),
            ]);

            $facture->update(['statut' => 'Annulée']);

            Audit::log('cancel', 'facture', "Facture annulée: {$facture->numero}", $facture->id);

            DB::commit();

            return response()->json(['message' => 'Facture annulée avec succès']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de l\'annulation', 'error' => $e->getMessage()], 500);
        }
    }

    public function duplicate(Facture $facture): JsonResponse
    {
        try {
            DB::beginTransaction();

            $newFacture = $facture->replicate();
            $newFacture->numero = $this->generateNumero();
            $newFacture->date = now();
            $newFacture->date_echeance = now()->addDays(30);
            $newFacture->statut = 'Brouillon';
            $newFacture->ordre_travail_id = null;
            $newFacture->save();

            foreach ($facture->lignes as $ligne) {
                $newLigne = $ligne->replicate();
                $newLigne->facture_id = $newFacture->id;
                $newLigne->save();
            }

            foreach ($facture->conteneurs as $conteneur) {
                $newCont = $conteneur->replicate();
                $newCont->facture_id = $newFacture->id;
                $newCont->save();

                foreach ($conteneur->operations as $operation) {
                    $newOp = $operation->replicate();
                    $newOp->conteneur_facture_id = $newCont->id;
                    $newOp->save();
                }
            }

            foreach ($facture->lots as $lot) {
                $newLot = $lot->replicate();
                $newLot->facture_id = $newFacture->id;
                $newLot->save();
            }

            Audit::log('duplicate', 'facture', "Facture dupliquée: {$facture->numero} -> {$newFacture->numero}", $newFacture->id);

            DB::commit();

            return response()->json(new FactureResource($newFacture->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots'])), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la duplication', 'error' => $e->getMessage()], 500);
        }
    }

    public function impayes(Request $request): JsonResponse
    {
        $query = Facture::with(['client', 'paiements'])
            ->whereIn('statut', ['Envoyée', 'Partiellement payée']);

        if ($request->has('client_id')) {
            $query->where('client_id', $request->get('client_id'));
        }

        $factures = $query->orderBy('date_echeance', 'asc')->get();

        return response()->json(FactureResource::collection($factures));
    }

    private function createLignes(Facture $facture, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            LigneFacture::create([
                'facture_id' => $facture->id,
                'type_operation' => $ligne['type_operation'],
                'description' => $ligne['description'] ?? null,
                'lieu_depart' => $ligne['lieu_depart'] ?? null,
                'lieu_arrivee' => $ligne['lieu_arrivee'] ?? null,
                'date_debut' => $ligne['date_debut'] ?? null,
                'date_fin' => $ligne['date_fin'] ?? null,
                'quantite' => $ligne['quantite'] ?? 1,
                'prix_unitaire' => $ligne['prix_unitaire'] ?? 0,
                'montant_ht' => ($ligne['quantite'] ?? 1) * ($ligne['prix_unitaire'] ?? 0),
            ]);
        }
    }

    private function createConteneurs(Facture $facture, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneur) {
            $cont = ConteneurFacture::create([
                'facture_id' => $facture->id,
                'numero' => $conteneur['numero'],
                'type' => $conteneur['type'],
                'taille' => $conteneur['taille'],
                'armateur_id' => $conteneur['armateur_id'] ?? null,
            ]);

            if (isset($conteneur['operations'])) {
                foreach ($conteneur['operations'] as $operation) {
                    OperationConteneurFacture::create([
                        'conteneur_facture_id' => $cont->id,
                        'type_operation' => $operation['type_operation'],
                        'description' => $operation['description'] ?? null,
                        'quantite' => $operation['quantite'] ?? 1,
                        'prix_unitaire' => $operation['prix_unitaire'] ?? 0,
                        'montant_ht' => ($operation['quantite'] ?? 1) * ($operation['prix_unitaire'] ?? 0),
                    ]);
                }
            }
        }
    }

    private function createLots(Facture $facture, array $lots): void
    {
        foreach ($lots as $lot) {
            LotFacture::create([
                'facture_id' => $facture->id,
                'designation' => $lot['designation'],
                'quantite' => $lot['quantite'] ?? 1,
                'poids' => $lot['poids'] ?? null,
                'volume' => $lot['volume'] ?? null,
                'prix_unitaire' => $lot['prix_unitaire'] ?? 0,
                'montant_ht' => ($lot['quantite'] ?? 1) * ($lot['prix_unitaire'] ?? 0),
            ]);
        }
    }

    private function generateNumero(): string
    {
        $prefix = Configuration::where('cle', 'prefixe_facture')->value('valeur') ?? 'FAC';
        $year = date('Y');
        $lastFacture = Facture::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $lastFacture ? (intval(substr($lastFacture->numero, -4)) + 1) : 1;
        return sprintf('%s-%s-%04d', $prefix, $year, $nextNumber);
    }

    private function calculerTotaux(Facture $facture): void
    {
        $montantHt = 0;
        $montantHt += $facture->lignes()->sum('montant_ht');
        foreach ($facture->conteneurs as $conteneur) {
            $montantHt += $conteneur->operations()->sum('montant_ht');
        }
        $montantHt += $facture->lots()->sum('montant_ht');

        $montantTva = $montantHt * ($facture->taux_tva / 100);
        $montantCss = $montantHt * ($facture->taux_css / 100);
        $montantTtc = $montantHt + $montantTva + $montantCss;

        $facture->update([
            'montant_ht' => $montantHt,
            'montant_tva' => $montantTva,
            'montant_css' => $montantCss,
            'montant_ttc' => $montantTtc,
        ]);
    }
}
