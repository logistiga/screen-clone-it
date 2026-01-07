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
        $montantHT = 0;

        // Additionner les lignes directes
        foreach ($ordre->lignes as $ligne) {
            $montantHT += $ligne->quantite * $ligne->prix_unitaire;
        }

        // Additionner les opérations des conteneurs
        foreach ($ordre->conteneurs as $conteneur) {
            foreach ($conteneur->operations as $operation) {
                $montantHT += $operation->quantite * $operation->prix_unitaire;
            }
        }

        // Additionner les lots
        foreach ($ordre->lots as $lot) {
            $montantHT += $lot->quantite * $lot->prix_unitaire;
        }

        // Récupérer les taux de taxes
        $config = Configuration::first();
        $tauxTVA = $config->taux_tva ?? 18;
        $tauxCSS = $config->taux_css ?? 1;

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
    }

    /**
     * Générer un numéro d'ordre unique
     */
    public function genererNumero(): string
    {
        $config = Configuration::first();
        $prefixe = $config->prefixe_ordre ?? 'OT';
        $annee = date('Y');
        
        $dernierOrdre = OrdreTravail::whereYear('created_at', $annee)
            ->orderBy('id', 'desc')
            ->first();

        $numero = $dernierOrdre ? intval(substr($dernierOrdre->numero, -4)) + 1 : 1;

        return sprintf('%s-%s-%04d', $prefixe, $annee, $numero);
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
