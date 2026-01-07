<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrdreTravailRequest;
use App\Http\Requests\UpdateOrdreTravailRequest;
use App\Http\Resources\OrdreTravailResource;
use App\Http\Resources\FactureResource;
use App\Models\OrdreTravail;
use App\Models\LigneOrdre;
use App\Models\ConteneurOrdre;
use App\Models\OperationConteneurOrdre;
use App\Models\LotOrdre;
use App\Models\Configuration;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrdreTravailController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = OrdreTravail::with(['client', 'transitaire', 'devis', 'lignes', 'conteneurs.operations', 'lots']);

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

        $ordres = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(OrdreTravailResource::collection($ordres)->response()->getData(true));
    }

    public function store(StoreOrdreTravailRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $numero = $this->generateNumero();
            $tauxTva = Configuration::where('cle', 'taux_tva')->value('valeur') ?? 18;
            $tauxCss = Configuration::where('cle', 'taux_css')->value('valeur') ?? 1;

            $ordre = OrdreTravail::create([
                'numero' => $numero,
                'client_id' => $request->client_id,
                'transitaire_id' => $request->transitaire_id,
                'devis_id' => $request->devis_id,
                'type_document' => $request->type_document,
                'date' => now(),
                'bl_numero' => $request->bl_numero,
                'navire' => $request->navire,
                'date_arrivee' => $request->date_arrivee,
                'notes' => $request->notes,
                'statut' => 'En attente',
                'taux_tva' => $tauxTva,
                'taux_css' => $tauxCss,
            ]);

            $this->createLignes($ordre, $request->lignes ?? []);
            $this->createConteneurs($ordre, $request->conteneurs ?? []);
            $this->createLots($ordre, $request->lots ?? []);
            $this->calculerTotaux($ordre);

            Audit::log('create', 'ordre', "Ordre créé: {$ordre->numero}", $ordre->id);

            DB::commit();

            return response()->json(new OrdreTravailResource($ordre->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots'])), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(OrdreTravail $ordreTravail): JsonResponse
    {
        $ordreTravail->load(['client', 'transitaire', 'devis', 'lignes', 'conteneurs.operations', 'conteneurs.armateur', 'lots', 'facture']);
        return response()->json(new OrdreTravailResource($ordreTravail));
    }

    public function update(UpdateOrdreTravailRequest $request, OrdreTravail $ordreTravail): JsonResponse
    {
        if ($ordreTravail->statut === 'Facturé') {
            return response()->json(['message' => 'Impossible de modifier un ordre facturé'], 422);
        }

        try {
            DB::beginTransaction();

            $ordreTravail->update($request->only([
                'client_id', 'transitaire_id', 'type_document', 'bl_numero',
                'navire', 'date_arrivee', 'notes', 'statut'
            ]));

            if ($request->has('lignes')) {
                $ordreTravail->lignes()->delete();
                $this->createLignes($ordreTravail, $request->lignes);
            }

            if ($request->has('conteneurs')) {
                $ordreTravail->conteneurs()->each(fn($c) => $c->operations()->delete());
                $ordreTravail->conteneurs()->delete();
                $this->createConteneurs($ordreTravail, $request->conteneurs);
            }

            if ($request->has('lots')) {
                $ordreTravail->lots()->delete();
                $this->createLots($ordreTravail, $request->lots);
            }

            $this->calculerTotaux($ordreTravail);

            Audit::log('update', 'ordre', "Ordre modifié: {$ordreTravail->numero}", $ordreTravail->id);

            DB::commit();

            return response()->json(new OrdreTravailResource($ordreTravail->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots'])));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(OrdreTravail $ordreTravail): JsonResponse
    {
        if ($ordreTravail->statut === 'Facturé') {
            return response()->json(['message' => 'Impossible de supprimer un ordre facturé'], 422);
        }

        Audit::log('delete', 'ordre', "Ordre supprimé: {$ordreTravail->numero}", $ordreTravail->id);

        $ordreTravail->conteneurs()->each(fn($c) => $c->operations()->delete());
        $ordreTravail->conteneurs()->delete();
        $ordreTravail->lignes()->delete();
        $ordreTravail->lots()->delete();
        $ordreTravail->delete();

        return response()->json(['message' => 'Ordre de travail supprimé avec succès']);
    }

    public function convertToFacture(OrdreTravail $ordreTravail): JsonResponse
    {
        if ($ordreTravail->statut === 'Facturé') {
            return response()->json(['message' => 'Cet ordre a déjà été facturé'], 422);
        }

        try {
            DB::beginTransaction();

            $facture = \App\Models\Facture::create([
                'numero' => $this->generateNumeroFacture(),
                'ordre_travail_id' => $ordreTravail->id,
                'client_id' => $ordreTravail->client_id,
                'transitaire_id' => $ordreTravail->transitaire_id,
                'type_document' => $ordreTravail->type_document,
                'date' => now(),
                'date_echeance' => now()->addDays(30),
                'bl_numero' => $ordreTravail->bl_numero,
                'navire' => $ordreTravail->navire,
                'date_arrivee' => $ordreTravail->date_arrivee,
                'notes' => $ordreTravail->notes,
                'statut' => 'Brouillon',
                'montant_ht' => $ordreTravail->montant_ht,
                'montant_tva' => $ordreTravail->montant_tva,
                'montant_css' => $ordreTravail->montant_css,
                'montant_ttc' => $ordreTravail->montant_ttc,
                'taux_tva' => $ordreTravail->taux_tva,
                'taux_css' => $ordreTravail->taux_css,
            ]);

            foreach ($ordreTravail->lignes as $ligne) {
                \App\Models\LigneFacture::create([
                    'facture_id' => $facture->id,
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

            foreach ($ordreTravail->conteneurs as $conteneur) {
                $newCont = \App\Models\ConteneurFacture::create([
                    'facture_id' => $facture->id,
                    'numero' => $conteneur->numero,
                    'type' => $conteneur->type,
                    'taille' => $conteneur->taille,
                    'armateur_id' => $conteneur->armateur_id,
                ]);

                foreach ($conteneur->operations as $operation) {
                    \App\Models\OperationConteneurFacture::create([
                        'conteneur_facture_id' => $newCont->id,
                        'type_operation' => $operation->type_operation,
                        'description' => $operation->description,
                        'quantite' => $operation->quantite,
                        'prix_unitaire' => $operation->prix_unitaire,
                        'montant_ht' => $operation->montant_ht,
                    ]);
                }
            }

            foreach ($ordreTravail->lots as $lot) {
                \App\Models\LotFacture::create([
                    'facture_id' => $facture->id,
                    'designation' => $lot->designation,
                    'quantite' => $lot->quantite,
                    'poids' => $lot->poids,
                    'volume' => $lot->volume,
                    'prix_unitaire' => $lot->prix_unitaire,
                    'montant_ht' => $lot->montant_ht,
                ]);
            }

            $ordreTravail->update(['statut' => 'Facturé']);

            Audit::log('convert', 'ordre', "Ordre converti en facture: {$ordreTravail->numero} -> {$facture->numero}", $ordreTravail->id);

            DB::commit();

            return response()->json([
                'message' => 'Ordre converti en facture',
                'facture' => new FactureResource($facture->load(['client', 'transitaire', 'lignes', 'conteneurs.operations', 'lots']))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la conversion', 'error' => $e->getMessage()], 500);
        }
    }

    private function createLignes(OrdreTravail $ordre, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            LigneOrdre::create([
                'ordre_travail_id' => $ordre->id,
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

    private function createConteneurs(OrdreTravail $ordre, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneur) {
            $cont = ConteneurOrdre::create([
                'ordre_travail_id' => $ordre->id,
                'numero' => $conteneur['numero'],
                'type' => $conteneur['type'],
                'taille' => $conteneur['taille'],
                'armateur_id' => $conteneur['armateur_id'] ?? null,
            ]);

            if (isset($conteneur['operations'])) {
                foreach ($conteneur['operations'] as $operation) {
                    OperationConteneurOrdre::create([
                        'conteneur_ordre_id' => $cont->id,
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

    private function createLots(OrdreTravail $ordre, array $lots): void
    {
        foreach ($lots as $lot) {
            LotOrdre::create([
                'ordre_travail_id' => $ordre->id,
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
        $prefix = Configuration::where('cle', 'prefixe_ordre')->value('valeur') ?? 'OT';
        $year = date('Y');
        $lastOrdre = OrdreTravail::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $lastOrdre ? (intval(substr($lastOrdre->numero, -4)) + 1) : 1;
        return sprintf('%s-%s-%04d', $prefix, $year, $nextNumber);
    }

    private function generateNumeroFacture(): string
    {
        $prefix = Configuration::where('cle', 'prefixe_facture')->value('valeur') ?? 'FAC';
        $year = date('Y');
        $lastFacture = \App\Models\Facture::whereYear('created_at', $year)->orderBy('id', 'desc')->first();
        $nextNumber = $lastFacture ? (intval(substr($lastFacture->numero, -4)) + 1) : 1;
        return sprintf('%s-%s-%04d', $prefix, $year, $nextNumber);
    }

    private function calculerTotaux(OrdreTravail $ordre): void
    {
        $montantHt = 0;
        $montantHt += $ordre->lignes()->sum('montant_ht');
        foreach ($ordre->conteneurs as $conteneur) {
            $montantHt += $conteneur->operations()->sum('montant_ht');
        }
        $montantHt += $ordre->lots()->sum('montant_ht');

        $montantTva = $montantHt * ($ordre->taux_tva / 100);
        $montantCss = $montantHt * ($ordre->taux_css / 100);
        $montantTtc = $montantHt + $montantTva + $montantCss;

        $ordre->update([
            'montant_ht' => $montantHt,
            'montant_tva' => $montantTva,
            'montant_css' => $montantCss,
            'montant_ttc' => $montantTtc,
        ]);
    }
}
