<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrdreTravailResource;
use App\Http\Resources\FactureResource;
use App\Http\Resources\DevisResource;
use App\Models\Devis;
use App\Models\OrdreTravail;
use App\Models\Audit;
use App\Services\Facture\FactureServiceFactory;
use App\Support\DocumentCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Conversion et duplication de devis
 */
class DevisConversionController extends Controller
{
    public function convertToOrdre(Devis $devis): JsonResponse
    {
        if (strtolower($devis->statut) === 'converti') {
            return response()->json(['message' => 'Ce devis a déjà été converti'], 422);
        }

        try {
            $ordre = DB::transaction(function () use ($devis) {
                $devis->load(['lignes', 'conteneurs.operations', 'lots']);

                $categorieNormalisee = DocumentCategory::normalize($devis->categorie);

                // Construire taxes_selection avec fallback robuste
                $taxesSelection = $devis->taxes_selection;
                if (empty($taxesSelection) || !is_array($taxesSelection) || !isset($taxesSelection['selected_tax_codes'])) {
                    $taxesSelection = [
                        'selected_tax_codes' => ['TVA', 'CSS'],
                        'has_exoneration' => (bool) ($devis->exonere_tva || $devis->exonere_css),
                        'exonerated_tax_codes' => array_filter([
                            $devis->exonere_tva ? 'TVA' : null,
                            $devis->exonere_css ? 'CSS' : null,
                        ]),
                        'motif_exoneration' => $devis->motif_exoneration ?? '',
                    ];
                }

                $ordre = OrdreTravail::create([
                    'numero' => OrdreTravail::genererNumero(),
                    'devis_id' => $devis->id,
                    'client_id' => $devis->client_id,
                    'date_creation' => now()->toDateString(),
                    'categorie' => $categorieNormalisee,
                    'type_operation' => $devis->type_operation,
                    'type_operation_indep' => $devis->type_operation_indep,
                    'armateur_id' => $devis->armateur_id,
                    'transitaire_id' => $devis->transitaire_id,
                    'representant_id' => $devis->representant_id,
                    'navire' => $devis->navire,
                    'numero_bl' => $devis->numero_bl,
                    'montant_ht' => $devis->montant_ht,
                    'tva' => $devis->tva,
                    'css' => $devis->css,
                    'montant_ttc' => $devis->montant_ttc,
                    'montant_paye' => 0,
                    'statut' => 'en_cours',
                    'notes' => $devis->notes,
                    'remise_type' => $devis->remise_type,
                    'remise_valeur' => $devis->remise_valeur,
                    'remise_montant' => $devis->remise_montant,
                    'taxes_selection' => $taxesSelection,
                    'exonere_tva' => $devis->exonere_tva ?? false,
                    'exonere_css' => $devis->exonere_css ?? false,
                    'motif_exoneration' => $devis->motif_exoneration,
                ]);

                foreach ($devis->lignes as $ligne) {
                    $ordre->lignes()->create([
                        'description' => $ligne->description,
                        'quantite' => $ligne->quantite,
                        'prix_unitaire' => $ligne->prix_unitaire,
                        'montant_ht' => $ligne->montant_ht,
                        'lieu_depart' => $ligne->lieu_depart,
                        'lieu_arrivee' => $ligne->lieu_arrivee,
                        'date_debut' => $ligne->date_debut,
                        'date_fin' => $ligne->date_fin,
                    ]);
                }

                foreach ($devis->conteneurs as $conteneur) {
                    $newConteneur = $ordre->conteneurs()->create([
                        'numero' => $conteneur->numero,
                        'taille' => $conteneur->taille,
                        'description' => $conteneur->description,
                        'prix_unitaire' => $conteneur->prix_unitaire,
                    ]);

                    foreach ($conteneur->operations as $op) {
                        $newConteneur->operations()->create([
                            'type' => $op->type,
                            'description' => $op->description,
                            'quantite' => $op->quantite,
                            'prix_unitaire' => $op->prix_unitaire,
                            'prix_total' => $op->prix_total,
                        ]);
                    }
                }

                foreach ($devis->lots as $lot) {
                    $ordre->lots()->create([
                        'numero_lot' => $lot->numero_lot,
                        'description' => $lot->description,
                        'quantite' => $lot->quantite,
                        'poids' => $lot->poids,
                        'volume' => $lot->volume,
                        'prix_unitaire' => $lot->prix_unitaire,
                        'prix_total' => $lot->prix_total,
                    ]);
                }

                $devis->update(['statut' => 'converti']);

                return $ordre;
            });

            Audit::log('convert', 'devis', "Devis converti en ordre: {$devis->numero} -> {$ordre->numero}", $devis->id);

            return response()->json([
                'message' => 'Devis converti en ordre de travail',
                'ordre' => new OrdreTravailResource($ordre->fresh(['client', 'lignes', 'conteneurs.operations', 'lots']))
            ]);

        } catch (\Throwable $e) {
            Log::error('Erreur conversion devis->ordre', ['devis_id' => $devis->id, 'message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la conversion',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function convertToFacture(Devis $devis): JsonResponse
    {
        if (strtolower($devis->statut) === 'facture') {
            return response()->json(['message' => 'Ce devis a déjà été facturé'], 422);
        }

        try {
            $facture = DB::transaction(function () use ($devis) {
                // IMPORTANT: Charger toutes les relations AVANT la conversion
                $devis->load(['lignes', 'conteneurs.operations', 'lots']);

                $factureFactory = app(FactureServiceFactory::class);

                $categorieNormalisee = DocumentCategory::normalize($devis->categorie);

                // Construire taxes_selection avec fallback robuste
                $taxesSelection = $devis->taxes_selection;
                if (empty($taxesSelection) || !is_array($taxesSelection) || !isset($taxesSelection['selected_tax_codes'])) {
                    $taxesSelection = [
                        'selected_tax_codes' => ['TVA', 'CSS'],
                        'has_exoneration' => (bool) ($devis->exonere_tva || $devis->exonere_css),
                        'exonerated_tax_codes' => array_filter([
                            $devis->exonere_tva ? 'TVA' : null,
                            $devis->exonere_css ? 'CSS' : null,
                        ]),
                        'motif_exoneration' => $devis->motif_exoneration ?? '',
                    ];
                }

                Log::info('Conversion devis->facture', [
                    'devis_id' => $devis->id,
                    'categorie' => $categorieNormalisee,
                    'montant_ht_devis' => $devis->montant_ht,
                    'montant_ttc_devis' => $devis->montant_ttc,
                    'nb_lignes' => $devis->lignes->count(),
                    'nb_conteneurs' => $devis->conteneurs->count(),
                    'nb_lots' => $devis->lots->count(),
                    'taxes_selection' => $taxesSelection,
                ]);

                $factureData = [
                    'client_id' => $devis->client_id,
                    'devis_id' => $devis->id,
                    'date_creation' => now()->toDateString(),
                    'armateur_id' => $devis->armateur_id,
                    'transitaire_id' => $devis->transitaire_id,
                    'representant_id' => $devis->representant_id,
                    'categorie' => $categorieNormalisee,
                    'type_operation' => $devis->type_operation,
                    'type_operation_indep' => $devis->type_operation_indep,
                    'numero_bl' => $devis->numero_bl,
                    'navire' => $devis->navire,
                    'notes' => $devis->notes,
                    'statut' => 'emise',
                    'remise_type' => $devis->remise_type,
                    'remise_valeur' => $devis->remise_valeur,
                    'taxes_selection' => $taxesSelection,
                    'exonere_tva' => $devis->exonere_tva ?? false,
                    'exonere_css' => $devis->exonere_css ?? false,
                    'motif_exoneration' => $devis->motif_exoneration,
                ];

                if ($categorieNormalisee === 'conteneurs') {
                    $factureData['conteneurs'] = $devis->conteneurs->map(function ($c) {
                        return [
                            'numero' => $c->numero,
                            'taille' => $c->taille,
                            'description' => $c->description,
                            'prix_unitaire' => $c->prix_unitaire,
                            'operations' => $c->operations->map(function ($op) {
                                return [
                                    'type' => $op->type,
                                    'description' => $op->description,
                                    'quantite' => $op->quantite,
                                    'prix_unitaire' => $op->prix_unitaire,
                                    'prix_total' => $op->prix_total,
                                ];
                            })->toArray(),
                        ];
                    })->toArray();
                } elseif ($categorieNormalisee === 'conventionnel') {
                    $factureData['lots'] = $devis->lots->map(function ($l) {
                        return [
                            'numero_lot' => $l->numero_lot,
                            'description' => $l->description,
                            'quantite' => $l->quantite,
                            'poids' => $l->poids,
                            'volume' => $l->volume,
                            'prix_unitaire' => $l->prix_unitaire,
                            'prix_total' => $l->prix_total,
                        ];
                    })->toArray();
                } elseif ($categorieNormalisee === 'operations_independantes') {
                    $factureData['lignes'] = $devis->lignes->map(function ($l) {
                        return [
                            'description' => $l->description,
                            'quantite' => $l->quantite,
                            'prix_unitaire' => $l->prix_unitaire,
                            'montant_ht' => $l->montant_ht,
                            'lieu_depart' => $l->lieu_depart,
                            'lieu_arrivee' => $l->lieu_arrivee,
                            'date_debut' => $l->date_debut,
                            'date_fin' => $l->date_fin,
                        ];
                    })->toArray();
                }

                $facture = $factureFactory->creer($factureData);
                $devis->update(['statut' => 'facture']);

                return $facture;
            });

            Audit::log('convert', 'devis', "Devis converti en facture: {$devis->numero} -> {$facture->numero}", $devis->id);

            return response()->json([
                'message' => 'Devis converti en facture',
                'facture' => new FactureResource($facture->fresh(['client', 'lignes', 'conteneurs.operations', 'lots']))
            ]);

        } catch (\Throwable $e) {
            Log::error('Erreur conversion devis->facture', ['devis_id' => $devis->id, 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Erreur lors de la conversion en facture',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function duplicate(Devis $devis): JsonResponse
    {
        try {
            $newDevis = DB::transaction(function () use ($devis) {
                $devis->load(['lignes', 'conteneurs.operations', 'lots']);

                $newDevis = new Devis();
                $newDevis->fill([
                    'client_id' => $devis->client_id,
                    'categorie' => DocumentCategory::normalize($devis->categorie),
                    'type_operation' => $devis->type_operation,
                    'type_operation_indep' => $devis->type_operation_indep,
                    'armateur_id' => $devis->armateur_id,
                    'transitaire_id' => $devis->transitaire_id,
                    'representant_id' => $devis->representant_id,
                    'navire' => $devis->navire,
                    'numero_bl' => $devis->numero_bl,
                    'remise_type' => $devis->remise_type,
                    'remise_valeur' => $devis->remise_valeur,
                    'notes' => $devis->notes,
                ]);
                $newDevis->forceFill([
                    'numero' => Devis::genererNumero(),
                    'date_creation' => now()->toDateString(),
                    'date_validite' => now()->addDays(30)->toDateString(),
                    'statut' => 'brouillon',
                ]);
                $newDevis->save();

                foreach ($devis->lignes as $ligne) {
                    $newDevis->lignes()->create($ligne->only(['description', 'quantite', 'prix_unitaire', 'lieu_depart', 'lieu_arrivee', 'date_debut', 'date_fin']));
                }

                foreach ($devis->conteneurs as $conteneur) {
                    $newConteneur = $newDevis->conteneurs()->create($conteneur->only(['numero', 'taille', 'description', 'prix_unitaire']));
                    foreach ($conteneur->operations as $op) {
                        $newConteneur->operations()->create($op->only(['type', 'description', 'quantite', 'prix_unitaire']));
                    }
                }

                foreach ($devis->lots as $lot) {
                    $newDevis->lots()->create($lot->only(['numero_lot', 'description', 'quantite', 'poids', 'volume', 'prix_unitaire']));
                }

                $newDevis->calculerTotaux();

                return $newDevis;
            });

            Audit::log('duplicate', 'devis', "Devis dupliqué: {$devis->numero} -> {$newDevis->numero}", $newDevis->id);

            return response()->json(new DevisResource($newDevis->fresh(['client', 'lignes', 'conteneurs.operations', 'lots'])), 201);

        } catch (\Throwable $e) {
            Log::error('Erreur duplication devis', ['devis_id' => $devis->id, 'message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la duplication',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
