<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDevisRequest;
use App\Http\Requests\UpdateDevisRequest;
use App\Http\Resources\DevisResource;
use App\Models\Devis;
use App\Models\LigneDevis;
use App\Models\ConteneurDevis;
use App\Models\OperationConteneurDevis;
use App\Models\LotDevis;
use App\Models\Configuration;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DevisController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Devis::with(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
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

        $devis = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(DevisResource::collection($devis)->response()->getData(true));
    }

    public function store(StoreDevisRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $numero = $this->generateNumero();
            $tauxTva = Configuration::where('cle', 'taux_tva')->value('valeur') ?? 18;
            $tauxCss = Configuration::where('cle', 'taux_css')->value('valeur') ?? 1;

            $devis = Devis::create([
                'numero' => $numero,
                'client_id' => $request->client_id,
                'transitaire_id' => $request->transitaire_id,
                'type_document' => $request->type_document,
                'date' => now(),
                'validite_jours' => $request->validite_jours ?? 30,
                'bl_numero' => $request->bl_numero,
                'navire' => $request->navire,
                'date_arrivee' => $request->date_arrivee,
                'notes' => $request->notes,
                'statut' => 'Brouillon',
                'taux_tva' => $tauxTva,
                'taux_css' => $tauxCss,
            ]);

            $this->createLignes($devis, $request->lignes ?? []);
            $this->createConteneurs($devis, $request->conteneurs ?? []);
            $this->createLots($devis, $request->lots ?? []);
            $this->calculerTotaux($devis);

            Audit::log('create', 'devis', "Devis créé: {$devis->numero}", $devis->id);

            DB::commit();

            return response()->json(new DevisResource($devis->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots'])), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création du devis', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Devis $devis): JsonResponse
    {
        $devis->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'conteneurs.armateur', 'lots']);
        return response()->json(new DevisResource($devis));
    }

    public function update(UpdateDevisRequest $request, Devis $devis): JsonResponse
    {
        if ($devis->statut === 'Converti') {
            return response()->json(['message' => 'Impossible de modifier un devis converti'], 422);
        }

        try {
            DB::beginTransaction();

            $devis->update($request->only([
                'client_id', 'transitaire_id', 'type_document', 'bl_numero',
                'navire', 'date_arrivee', 'validite_jours', 'notes', 'statut'
            ]));

            if ($request->has('lignes')) {
                $devis->lignes()->delete();
                $this->createLignes($devis, $request->lignes);
            }

            if ($request->has('conteneurs')) {
                $devis->conteneurs()->each(fn($c) => $c->operations()->delete());
                $devis->conteneurs()->delete();
                $this->createConteneurs($devis, $request->conteneurs);
            }

            if ($request->has('lots')) {
                $devis->lots()->delete();
                $this->createLots($devis, $request->lots);
            }

            $this->calculerTotaux($devis);

            Audit::log('update', 'devis', "Devis modifié: {$devis->numero}", $devis->id);

            DB::commit();

            return response()->json(new DevisResource($devis->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots'])));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Devis $devis): JsonResponse
    {
        if ($devis->statut === 'Converti') {
            return response()->json(['message' => 'Impossible de supprimer un devis converti'], 422);
        }

        Audit::log('delete', 'devis', "Devis supprimé: {$devis->numero}", $devis->id);

        $devis->conteneurs()->each(fn($c) => $c->operations()->delete());
        $devis->conteneurs()->delete();
        $devis->lignes()->delete();
        $devis->lots()->delete();
        $devis->delete();

        return response()->json(['message' => 'Devis supprimé avec succès']);
    }

    public function convertToOrdre(Devis $devis): JsonResponse
    {
        if ($devis->statut === 'Converti') {
            return response()->json(['message' => 'Ce devis a déjà été converti'], 422);
        }

        try {
            DB::beginTransaction();

            $ordre = \App\Models\OrdreTravail::create([
                'numero' => $this->generateNumeroOrdre(),
                'devis_id' => $devis->id,
                'client_id' => $devis->client_id,
                'transitaire_id' => $devis->transitaire_id,
                'type_document' => $devis->type_document,
                'date' => now(),
                'bl_numero' => $devis->bl_numero,
                'navire' => $devis->navire,
                'date_arrivee' => $devis->date_arrivee,
                'notes' => $devis->notes,
                'statut' => 'En attente',
                'montant_ht' => $devis->montant_ht,
                'montant_tva' => $devis->montant_tva,
                'montant_css' => $devis->montant_css,
                'montant_ttc' => $devis->montant_ttc,
                'taux_tva' => $devis->taux_tva,
                'taux_css' => $devis->taux_css,
            ]);

            foreach ($devis->lignes as $ligne) {
                \App\Models\LigneOrdre::create([
                    'ordre_travail_id' => $ordre->id,
                    'type_operation' => $ligne->type_operation,
                    'description' => $ligne->description,
                    'lieu_depart' => $ligne->lieu_depart,
                    'lieu_arrivee' => $ligne->lieu_arrivee,
                    'date_debut' => $ligne->date_debut,
                    'date_fin' => $ligne->date_fin,
                    'quantite' => $ligne->quantite,
                    'prix_unitaire' => $ligne->prix_unitaire,
                    'montant_ht' => $ligne->montant_ht,
                ]);
            }

            foreach ($devis->conteneurs as $conteneur) {
                $newCont = \App\Models\ConteneurOrdre::create([
                    'ordre_travail_id' => $ordre->id,
                    'numero' => $conteneur->numero,
                    'type' => $conteneur->type,
                    'taille' => $conteneur->taille,
                    'armateur_id' => $conteneur->armateur_id,
                ]);

                foreach ($conteneur->operations as $operation) {
                    \App\Models\OperationConteneurOrdre::create([
                        'conteneur_ordre_id' => $newCont->id,
                        'type_operation' => $operation->type_operation,
                        'description' => $operation->description,
                        'quantite' => $operation->quantite,
                        'prix_unitaire' => $operation->prix_unitaire,
                        'montant_ht' => $operation->montant_ht,
                    ]);
                }
            }

            foreach ($devis->lots as $lot) {
                \App\Models\LotOrdre::create([
                    'ordre_travail_id' => $ordre->id,
                    'designation' => $lot->designation,
                    'quantite' => $lot->quantite,
                    'poids' => $lot->poids,
                    'volume' => $lot->volume,
                    'prix_unitaire' => $lot->prix_unitaire,
                    'montant_ht' => $lot->montant_ht,
                ]);
            }

            $devis->update(['statut' => 'Converti']);

            Audit::log('convert', 'devis', "Devis converti en ordre: {$devis->numero} -> {$ordre->numero}", $devis->id);

            DB::commit();

            return response()->json([
                'message' => 'Devis converti en ordre de travail',
                'ordre' => new \App\Http\Resources\OrdreTravailResource($ordre->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots']))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la conversion', 'error' => $e->getMessage()], 500);
        }
    }

    public function duplicate(Devis $devis): JsonResponse
    {
        try {
            DB::beginTransaction();

            $newDevis = $devis->replicate();
            $newDevis->numero = $this->generateNumero();
            $newDevis->date = now();
            $newDevis->statut = 'Brouillon';
            $newDevis->save();

            foreach ($devis->lignes as $ligne) {
                $newLigne = $ligne->replicate();
                $newLigne->devis_id = $newDevis->id;
                $newLigne->save();
            }

            foreach ($devis->conteneurs as $conteneur) {
                $newCont = $conteneur->replicate();
                $newCont->devis_id = $newDevis->id;
                $newCont->save();

                foreach ($conteneur->operations as $operation) {
                    $newOp = $operation->replicate();
                    $newOp->conteneur_devis_id = $newCont->id;
                    $newOp->save();
                }
            }

            foreach ($devis->lots as $lot) {
                $newLot = $lot->replicate();
                $newLot->devis_id = $newDevis->id;
                $newLot->save();
            }

            Audit::log('duplicate', 'devis', "Devis dupliqué: {$devis->numero} -> {$newDevis->numero}", $newDevis->id);

            DB::commit();

            return response()->json(new DevisResource($newDevis->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots'])), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la duplication', 'error' => $e->getMessage()], 500);
        }
    }

    private function createLignes(Devis $devis, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            LigneDevis::create([
                'devis_id' => $devis->id,
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

    private function createConteneurs(Devis $devis, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneur) {
            $cont = ConteneurDevis::create([
                'devis_id' => $devis->id,
                'numero' => $conteneur['numero'],
                'type' => $conteneur['type'],
                'taille' => $conteneur['taille'],
                'armateur_id' => $conteneur['armateur_id'] ?? null,
            ]);

            if (isset($conteneur['operations'])) {
                foreach ($conteneur['operations'] as $operation) {
                    OperationConteneurDevis::create([
                        'conteneur_devis_id' => $cont->id,
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

    private function createLots(Devis $devis, array $lots): void
    {
        foreach ($lots as $lot) {
            LotDevis::create([
                'devis_id' => $devis->id,
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
        $prefix = Configuration::where('cle', 'prefixe_devis')->value('valeur') ?? 'DEV';
        $year = date('Y');
        $lastDevis = Devis::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $lastDevis ? (intval(substr($lastDevis->numero, -4)) + 1) : 1;
        return sprintf('%s-%s-%04d', $prefix, $year, $nextNumber);
    }

    private function generateNumeroOrdre(): string
    {
        $prefix = Configuration::where('cle', 'prefixe_ordre')->value('valeur') ?? 'OT';
        $year = date('Y');
        $lastOrdre = \App\Models\OrdreTravail::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $lastOrdre ? (intval(substr($lastOrdre->numero, -4)) + 1) : 1;
        return sprintf('%s-%s-%04d', $prefix, $year, $nextNumber);
    }

    private function calculerTotaux(Devis $devis): void
    {
        $montantHt = 0;
        $montantHt += $devis->lignes()->sum('montant_ht');
        foreach ($devis->conteneurs as $conteneur) {
            $montantHt += $conteneur->operations()->sum('montant_ht');
        }
        $montantHt += $devis->lots()->sum('montant_ht');

        $montantTva = $montantHt * ($devis->taux_tva / 100);
        $montantCss = $montantHt * ($devis->taux_css / 100);
        $montantTtc = $montantHt + $montantTva + $montantCss;

        $devis->update([
            'montant_ht' => $montantHt,
            'montant_tva' => $montantTva,
            'montant_css' => $montantCss,
            'montant_ttc' => $montantTtc,
        ]);
    }
}
