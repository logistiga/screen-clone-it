<?php

namespace App\Services;

use App\Models\OrdreTravail;
use App\Models\Configuration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrdreTravailService
{
    /**
     * Créer un nouvel ordre de travail avec ses lignes, conteneurs et lots
     */
    public function creer(array $data): OrdreTravail
    {
        return DB::transaction(function () use ($data) {
            // Générer le numéro
            $data['numero'] = $this->genererNumero();
            $data['statut'] = $data['statut'] ?? 'en_cours';
            $data['montant_paye'] = 0;

            // Créer l'ordre
            $ordre = OrdreTravail::create($data);

            // Créer les lignes
            if (!empty($data['lignes'])) {
                $this->creerLignes($ordre, $data['lignes']);
            }

            // Créer les conteneurs
            if (!empty($data['conteneurs'])) {
                $this->creerConteneurs($ordre, $data['conteneurs']);
            }

            // Créer les lots
            if (!empty($data['lots'])) {
                $this->creerLots($ordre, $data['lots']);
            }

            // Calculer les totaux
            $this->calculerTotaux($ordre);

            Log::info('Ordre de travail créé', ['ordre_id' => $ordre->id, 'numero' => $ordre->numero]);

            return $ordre->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Mettre à jour un ordre de travail existant
     */
    public function modifier(OrdreTravail $ordre, array $data): OrdreTravail
    {
        return DB::transaction(function () use ($ordre, $data) {
            $ordre->update($data);

            // Remplacer les lignes si fournies
            if (isset($data['lignes'])) {
                $ordre->lignes()->delete();
                $this->creerLignes($ordre, $data['lignes']);
            }

            // Remplacer les conteneurs si fournis
            if (isset($data['conteneurs'])) {
                foreach ($ordre->conteneurs as $conteneur) {
                    $conteneur->operations()->delete();
                }
                $ordre->conteneurs()->delete();
                $this->creerConteneurs($ordre, $data['conteneurs']);
            }

            // Remplacer les lots si fournis
            if (isset($data['lots'])) {
                $ordre->lots()->delete();
                $this->creerLots($ordre, $data['lots']);
            }

            // Recalculer les totaux
            $this->calculerTotaux($ordre);

            Log::info('Ordre de travail modifié', ['ordre_id' => $ordre->id]);

            return $ordre->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Convertir un ordre de travail en facture
     */
    public function convertirEnFacture(OrdreTravail $ordre): \App\Models\Facture
    {
        return DB::transaction(function () use ($ordre) {
            $factureService = app(FactureService::class);
            
            $factureData = [
                'client_id' => $ordre->client_id,
                'ordre_id' => $ordre->id,
                'armateur_id' => $ordre->armateur_id,
                'transitaire_id' => $ordre->transitaire_id,
                'representant_id' => $ordre->representant_id,
                'type_document' => $ordre->type_document,
                'categorie' => $ordre->categorie,
                'bl_numero' => $ordre->bl_numero,
                'navire' => $ordre->navire,
                'date_arrivee' => $ordre->date_arrivee,
                'notes' => $ordre->notes,
                'statut' => 'brouillon',
            ];

            // Préparer les lignes
            $factureData['lignes'] = $ordre->lignes->map(function ($ligne) {
                return [
                    'type_operation' => $ligne->type_operation,
                    'description' => $ligne->description,
                    'lieu_depart' => $ligne->lieu_depart,
                    'lieu_arrivee' => $ligne->lieu_arrivee,
                    'date_debut' => $ligne->date_debut,
                    'date_fin' => $ligne->date_fin,
                    'quantite' => $ligne->quantite,
                    'prix_unitaire' => $ligne->prix_unitaire,
                ];
            })->toArray();

            // Préparer les conteneurs avec leurs opérations
            $factureData['conteneurs'] = $ordre->conteneurs->map(function ($conteneur) {
                return [
                    'numero' => $conteneur->numero,
                    'type' => $conteneur->type,
                    'taille' => $conteneur->taille,
                    'armateur_id' => $conteneur->armateur_id,
                    'operations' => $conteneur->operations->map(function ($op) {
                        return [
                            'type_operation' => $op->type_operation,
                            'description' => $op->description,
                            'lieu_depart' => $op->lieu_depart,
                            'lieu_arrivee' => $op->lieu_arrivee,
                            'date_debut' => $op->date_debut,
                            'date_fin' => $op->date_fin,
                            'quantite' => $op->quantite,
                            'prix_unitaire' => $op->prix_unitaire,
                        ];
                    })->toArray(),
                ];
            })->toArray();

            // Préparer les lots
            $factureData['lots'] = $ordre->lots->map(function ($lot) {
                return [
                    'designation' => $lot->designation,
                    'quantite' => $lot->quantite,
                    'poids' => $lot->poids,
                    'volume' => $lot->volume,
                    'prix_unitaire' => $lot->prix_unitaire,
                ];
            })->toArray();

            $facture = $factureService->creer($factureData);

            // Mettre à jour le statut de l'ordre
            $ordre->update(['statut' => 'facture']);

            Log::info('Ordre converti en facture', ['ordre_id' => $ordre->id, 'facture_id' => $facture->id]);

            return $facture;
        });
    }

    /**
     * Enregistrer un paiement sur un ordre
     */
    public function enregistrerPaiement(OrdreTravail $ordre, float $montant): void
    {
        $nouveauMontantPaye = $ordre->montant_paye + $montant;
        
        $statut = $ordre->statut;
        if ($nouveauMontantPaye >= $ordre->montant_ttc && $ordre->statut !== 'facture') {
            $statut = 'termine';
        }

        $ordre->update([
            'montant_paye' => $nouveauMontantPaye,
            'statut' => $statut,
        ]);

        Log::info('Paiement enregistré sur ordre', [
            'ordre_id' => $ordre->id,
            'montant' => $montant,
        ]);
    }

    /**
     * Dupliquer un ordre de travail
     */
    public function dupliquer(OrdreTravail $ordre): OrdreTravail
    {
        $data = $ordre->toArray();
        unset($data['id'], $data['numero'], $data['devis_id'], $data['created_at'], $data['updated_at']);
        
        $data['lignes'] = $ordre->lignes->toArray();
        $data['conteneurs'] = $ordre->conteneurs->map(function ($c) {
            $arr = $c->toArray();
            $arr['operations'] = $c->operations->toArray();
            return $arr;
        })->toArray();
        $data['lots'] = $ordre->lots->toArray();
        $data['statut'] = 'en_cours';
        $data['montant_paye'] = 0;

        return $this->creer($data);
    }

    /**
     * Calculer les totaux de l'ordre
     */
    public function calculerTotaux(OrdreTravail $ordre): void
    {
        // Recharger les relations
        $ordre->load(['lignes', 'conteneurs.operations', 'lots']);
        
        $montantHT = 0;

        // Additionner les lignes directes
        foreach ($ordre->lignes as $ligne) {
            $montantHT += ($ligne->quantite ?? 1) * ($ligne->prix_unitaire ?? 0);
        }

        // Additionner les opérations des conteneurs
        foreach ($ordre->conteneurs as $conteneur) {
            foreach ($conteneur->operations as $operation) {
                $montantHT += ($operation->quantite ?? 1) * ($operation->prix_unitaire ?? 0);
            }
        }

        // Additionner les lots
        foreach ($ordre->lots as $lot) {
            $montantHT += ($lot->quantite ?? 1) * ($lot->prix_unitaire ?? 0);
        }

        // Récupérer les taux de taxes depuis la configuration
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;

        // Calculer selon la catégorie
        if ($ordre->categorie === 'non_assujetti') {
            $montantTVA = 0;
            $montantCSS = 0;
        } else {
            $montantTVA = $montantHT * ($tauxTVA / 100);
            $montantCSS = $montantHT * ($tauxCSS / 100);
        }

        $montantTTC = $montantHT + $montantTVA + $montantCSS;

        $ordre->update([
            'montant_ht' => $montantHT,
            'montant_tva' => $montantTVA,
            'montant_css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
        
        Log::info('Totaux ordre calculés', [
            'ordre_id' => $ordre->id,
            'montant_ht' => $montantHT,
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Générer un numéro d'ordre unique
     */
    public function genererNumero(): string
    {
        $annee = date('Y');
        
        return DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();
            
            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'],
                ]);
            }
            
            $prefixe = $config->data['prefixe_ordre'] ?? 'OT';

            // Trouver le numéro maximum existant
            $maxNumero = OrdreTravail::withTrashed()
                ->where('numero', 'like', $prefixe . '-' . $annee . '-%')
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = ($maxNumero ?? 0) + 1;

            // S'assurer que le numéro est au moins égal au compteur stocké
            $compteurStocke = $config->data['prochain_numero_ordre'] ?? 1;
            if ($prochainNumero < $compteurStocke) {
                $prochainNumero = $compteurStocke;
            }

            // Vérifier l'unicité
            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            while (OrdreTravail::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            // Mettre à jour le compteur
            $data = $config->data;
            $data['prochain_numero_ordre'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return $numero;
        });
    }

    /**
     * Créer les lignes d'un ordre
     */
    protected function creerLignes(OrdreTravail $ordre, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $ordre->lignes()->create($ligne);
        }
    }

    /**
     * Créer les conteneurs d'un ordre avec leurs opérations
     */
    protected function creerConteneurs(OrdreTravail $ordre, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneurData) {
            $operations = $conteneurData['operations'] ?? [];
            unset($conteneurData['operations']);

            $conteneur = $ordre->conteneurs()->create($conteneurData);

            foreach ($operations as $operation) {
                $conteneur->operations()->create($operation);
            }
        }
    }

    /**
     * Créer les lots d'un ordre
     */
    protected function creerLots(OrdreTravail $ordre, array $lots): void
    {
        foreach ($lots as $lot) {
            $ordre->lots()->create($lot);
        }
    }
}
