<?php

namespace App\Services;

use App\Models\Devis;
use App\Models\LigneDevis;
use App\Models\ConteneurDevis;
use App\Models\LotDevis;
use App\Models\OperationConteneurDevis;
use App\Models\Configuration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DevisService
{
    /**
     * Normaliser le payload API vers le schéma DB actuel.
     */
    protected function normaliserDonneesDevis(array $data): array
    {
        // type_document (API) -> categorie (DB)
        if (!isset($data['categorie']) && isset($data['type_document'])) {
            $data['categorie'] = match ($data['type_document']) {
                'Conteneur' => 'conteneurs',
                'Lot' => 'conventionnel',
                'Independant' => 'operations_independantes',
                default => 'conteneurs',
            };
        }

        // bl_numero (API) -> numero_bl (DB)
        if (isset($data['bl_numero']) && !isset($data['numero_bl'])) {
            $data['numero_bl'] = $data['bl_numero'];
        }
        unset($data['bl_numero'], $data['type_document']);

        // dates
        $dateCreation = $data['date_creation'] ?? now()->toDateString();
        $data['date_creation'] = $dateCreation;

        if (!isset($data['date_validite'])) {
            $validite = isset($data['validite_jours']) ? (int) $data['validite_jours'] : 30;
            $validite = max(1, min(365, $validite));
            $data['date_validite'] = now()->addDays($validite)->toDateString();
        }
        unset($data['validite_jours'], $data['date_arrivee']);

        return $data;
    }

    /**
     * Créer un nouveau devis avec ses lignes, conteneurs et lots
     */
    public function creer(array $data): Devis
    {
        return DB::transaction(function () use ($data) {
            $data = $this->normaliserDonneesDevis($data);

            // Générer le numéro
            $data['numero'] = $this->genererNumero();
            $data['statut'] = $data['statut'] ?? 'brouillon';

            // Extraire les relations avant l'insert
            $lignes = $data['lignes'] ?? [];
            $conteneurs = $data['conteneurs'] ?? [];
            $lots = $data['lots'] ?? [];
            unset($data['lignes'], $data['conteneurs'], $data['lots']);

            // Créer le devis
            $devis = Devis::create($data);

            // Créer les lignes
            if (!empty($lignes)) {
                $this->creerLignes($devis, $lignes);
            }

            // Créer les conteneurs
            if (!empty($conteneurs)) {
                $this->creerConteneurs($devis, $conteneurs);
            }

            // Créer les lots
            if (!empty($lots)) {
                $this->creerLots($devis, $lots);
            }

            // Calculer les totaux
            $this->calculerTotaux($devis);

            Log::info('Devis créé', ['devis_id' => $devis->id, 'numero' => $devis->numero]);

            return $devis->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Mettre à jour un devis existant
     */
    public function modifier(Devis $devis, array $data): Devis
    {
        return DB::transaction(function () use ($devis, $data) {
            $devis->update($data);

            // Remplacer les lignes si fournies
            if (isset($data['lignes'])) {
                $devis->lignes()->delete();
                $this->creerLignes($devis, $data['lignes']);
            }

            // Remplacer les conteneurs si fournis
            if (isset($data['conteneurs'])) {
                foreach ($devis->conteneurs as $conteneur) {
                    $conteneur->operations()->delete();
                }
                $devis->conteneurs()->delete();
                $this->creerConteneurs($devis, $data['conteneurs']);
            }

            // Remplacer les lots si fournis
            if (isset($data['lots'])) {
                $devis->lots()->delete();
                $this->creerLots($devis, $data['lots']);
            }

            // Recalculer les totaux
            $this->calculerTotaux($devis);

            Log::info('Devis modifié', ['devis_id' => $devis->id]);

            return $devis->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Convertir un devis en ordre de travail
     */
    public function convertirEnOrdre(Devis $devis): \App\Models\OrdreTravail
    {
        return DB::transaction(function () use ($devis) {
            $ordreService = app(OrdreTravailService::class);
            
            $ordreData = [
                'client_id' => $devis->client_id,
                'devis_id' => $devis->id,
                'armateur_id' => $devis->armateur_id,
                'transitaire_id' => $devis->transitaire_id,
                'representant_id' => $devis->representant_id,
                'type_document' => $devis->type_document,
                'categorie' => $devis->categorie,
                'bl_numero' => $devis->bl_numero,
                'navire' => $devis->navire,
                'date_arrivee' => $devis->date_arrivee,
                'notes' => $devis->notes,
                'statut' => 'en_cours',
            ];

            // Préparer les lignes
            $ordreData['lignes'] = $devis->lignes->map(function ($ligne) {
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
            $ordreData['conteneurs'] = $devis->conteneurs->map(function ($conteneur) {
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
            $ordreData['lots'] = $devis->lots->map(function ($lot) {
                return [
                    'designation' => $lot->designation,
                    'quantite' => $lot->quantite,
                    'poids' => $lot->poids,
                    'volume' => $lot->volume,
                    'prix_unitaire' => $lot->prix_unitaire,
                ];
            })->toArray();

            $ordre = $ordreService->creer($ordreData);

            // Mettre à jour le statut du devis
            $devis->update(['statut' => 'converti']);

            Log::info('Devis converti en ordre', ['devis_id' => $devis->id, 'ordre_id' => $ordre->id]);

            return $ordre;
        });
    }

    /**
     * Dupliquer un devis
     */
    public function dupliquer(Devis $devis): Devis
    {
        $data = $devis->toArray();
        unset($data['id'], $data['numero'], $data['created_at'], $data['updated_at']);
        
        $data['lignes'] = $devis->lignes->toArray();
        $data['conteneurs'] = $devis->conteneurs->map(function ($c) {
            $arr = $c->toArray();
            $arr['operations'] = $c->operations->toArray();
            return $arr;
        })->toArray();
        $data['lots'] = $devis->lots->toArray();
        $data['statut'] = 'brouillon';

        return $this->creer($data);
    }

    /**
     * Calculer les totaux du devis
     */
    public function calculerTotaux(Devis $devis): void
    {
        $montantHT = 0;

        // Additionner les lignes directes
        foreach ($devis->lignes as $ligne) {
            $montantHT += $ligne->quantite * $ligne->prix_unitaire;
        }

        // Additionner les opérations des conteneurs
        foreach ($devis->conteneurs as $conteneur) {
            foreach ($conteneur->operations as $operation) {
                $montantHT += $operation->quantite * $operation->prix_unitaire;
            }
        }

        // Additionner les lots
        foreach ($devis->lots as $lot) {
            $montantHT += $lot->quantite * $lot->prix_unitaire;
        }

        // Récupérer les taux de taxes
        $config = Configuration::first();
        $tauxTVA = $config->taux_tva ?? 18;
        $tauxCSS = $config->taux_css ?? 1;

        // Calculer selon la catégorie
        if ($devis->categorie === 'non_assujetti') {
            $montantTVA = 0;
            $montantCSS = 0;
        } else {
            $montantTVA = $montantHT * ($tauxTVA / 100);
            $montantCSS = $montantHT * ($tauxCSS / 100);
        }

        $montantTTC = $montantHT + $montantTVA + $montantCSS;

        $devis->update([
            'montant_ht' => $montantHT,
            'tva' => $montantTVA,
            'css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Générer un numéro de devis unique
     */
    public function genererNumero(): string
    {
        $config = Configuration::first();
        $prefixe = $config->prefixe_devis ?? 'DEV';
        $annee = date('Y');
        
        $dernierDevis = Devis::whereYear('created_at', $annee)
            ->orderBy('id', 'desc')
            ->first();

        $numero = $dernierDevis ? intval(substr($dernierDevis->numero, -4)) + 1 : 1;

        return sprintf('%s-%s-%04d', $prefixe, $annee, $numero);
    }

    /**
     * Créer les lignes d'un devis
     */
    protected function creerLignes(Devis $devis, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $devis->lignes()->create($ligne);
        }
    }

    /**
     * Créer les conteneurs d'un devis avec leurs opérations
     */
    protected function creerConteneurs(Devis $devis, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneurData) {
            $operations = $conteneurData['operations'] ?? [];
            unset($conteneurData['operations']);

            $conteneur = $devis->conteneurs()->create($conteneurData);

            foreach ($operations as $operation) {
                // API -> DB: type_operation -> type
                if (isset($operation['type_operation']) && !isset($operation['type'])) {
                    $operation['type'] = $operation['type_operation'];
                    unset($operation['type_operation']);
                }
                $conteneur->operations()->create($operation);
            }
        }
    }

    /**
     * Créer les lots d'un devis
     */
    protected function creerLots(Devis $devis, array $lots): void
    {
        foreach (array_values($lots) as $i => $lot) {
            // API -> DB
            if (isset($lot['designation']) && !isset($lot['description'])) {
                $lot['description'] = $lot['designation'];
            }
            if (!isset($lot['numero_lot'])) {
                $lot['numero_lot'] = 'LOT-' . ($i + 1);
            }

            unset($lot['designation']);

            $devis->lots()->create($lot);
        }
    }
}
