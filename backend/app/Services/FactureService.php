<?php

namespace App\Services;

use App\Models\Facture;
use App\Models\Configuration;
use App\Models\Client;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FactureService
{
    /**
     * Créer une nouvelle facture avec ses lignes, conteneurs et lots
     */
    public function creer(array $data): Facture
    {
        return DB::transaction(function () use ($data) {
            // Générer le numéro
            $data['numero'] = $this->genererNumero();
            $data['statut'] = $data['statut'] ?? 'brouillon';
            $data['montant_paye'] = 0;

            // Créer la facture
            $facture = Facture::create($data);

            // Créer les lignes
            if (!empty($data['lignes'])) {
                $this->creerLignes($facture, $data['lignes']);
            }

            // Créer les conteneurs
            if (!empty($data['conteneurs'])) {
                $this->creerConteneurs($facture, $data['conteneurs']);
            }

            // Créer les lots
            if (!empty($data['lots'])) {
                $this->creerLots($facture, $data['lots']);
            }

            // Calculer les totaux
            $this->calculerTotaux($facture);

            // Mettre à jour le solde client
            $this->mettreAJourSoldeClient($facture->client_id);

            Log::info('Facture créée', ['facture_id' => $facture->id, 'numero' => $facture->numero]);

            return $facture->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Mettre à jour une facture existante
     */
    public function modifier(Facture $facture, array $data): Facture
    {
        return DB::transaction(function () use ($facture, $data) {
            $ancienClientId = $facture->client_id;
            
            $facture->update($data);

            // Remplacer les lignes si fournies
            if (isset($data['lignes'])) {
                $facture->lignes()->delete();
                $this->creerLignes($facture, $data['lignes']);
            }

            // Remplacer les conteneurs si fournis
            if (isset($data['conteneurs'])) {
                foreach ($facture->conteneurs as $conteneur) {
                    $conteneur->operations()->delete();
                }
                $facture->conteneurs()->delete();
                $this->creerConteneurs($facture, $data['conteneurs']);
            }

            // Remplacer les lots si fournis
            if (isset($data['lots'])) {
                $facture->lots()->delete();
                $this->creerLots($facture, $data['lots']);
            }

            // Recalculer les totaux
            $this->calculerTotaux($facture);

            // Mettre à jour les soldes clients si changement
            $this->mettreAJourSoldeClient($facture->client_id);
            if ($ancienClientId !== $facture->client_id) {
                $this->mettreAJourSoldeClient($ancienClientId);
            }

            Log::info('Facture modifiée', ['facture_id' => $facture->id]);

            return $facture->fresh(['lignes', 'conteneurs.operations', 'lots', 'client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Enregistrer un paiement sur une facture
     */
    public function enregistrerPaiement(Facture $facture, float $montant): void
    {
        $nouveauMontantPaye = $facture->montant_paye + $montant;
        
        $statut = $facture->statut;
        if ($nouveauMontantPaye >= $facture->montant_ttc) {
            $statut = 'payee';
        } elseif ($nouveauMontantPaye > 0) {
            $statut = 'partiellement_payee';
        }

        $facture->update([
            'montant_paye' => $nouveauMontantPaye,
            'statut' => $statut,
        ]);

        // Mettre à jour le solde client
        $this->mettreAJourSoldeClient($facture->client_id);

        Log::info('Paiement enregistré sur facture', [
            'facture_id' => $facture->id,
            'montant' => $montant,
            'nouveau_statut' => $statut,
        ]);
    }

    /**
     * Valider une facture (passage de brouillon à validée)
     */
    public function valider(Facture $facture): Facture
    {
        if ($facture->statut !== 'brouillon') {
            throw new \Exception('Seules les factures en brouillon peuvent être validées.');
        }

        $facture->update(['statut' => 'validee']);

        Log::info('Facture validée', ['facture_id' => $facture->id]);

        return $facture;
    }

    /**
     * Dupliquer une facture
     */
    public function dupliquer(Facture $facture): Facture
    {
        $data = $facture->toArray();
        unset($data['id'], $data['numero'], $data['ordre_id'], $data['created_at'], $data['updated_at']);
        
        $data['lignes'] = $facture->lignes->toArray();
        $data['conteneurs'] = $facture->conteneurs->map(function ($c) {
            $arr = $c->toArray();
            $arr['operations'] = $c->operations->toArray();
            return $arr;
        })->toArray();
        $data['lots'] = $facture->lots->toArray();
        $data['statut'] = 'brouillon';
        $data['montant_paye'] = 0;

        return $this->creer($data);
    }

    /**
     * Calculer les totaux de la facture
     */
    public function calculerTotaux(Facture $facture): void
    {
        // Recharger les relations
        $facture->load(['lignes', 'conteneurs.operations', 'lots']);
        
        $montantHT = 0;

        // Additionner les lignes directes
        foreach ($facture->lignes as $ligne) {
            $montantHT += ($ligne->quantite ?? 1) * ($ligne->prix_unitaire ?? 0);
        }

        // Additionner les opérations des conteneurs
        foreach ($facture->conteneurs as $conteneur) {
            foreach ($conteneur->operations as $operation) {
                $montantHT += ($operation->quantite ?? 1) * ($operation->prix_unitaire ?? 0);
            }
        }

        // Additionner les lots
        foreach ($facture->lots as $lot) {
            $montantHT += ($lot->quantite ?? 1) * ($lot->prix_unitaire ?? 0);
        }

        // Récupérer les taux de taxes depuis la configuration
        $taxesConfig = Configuration::getOrCreate('taxes');
        $tauxTVA = $taxesConfig->data['tva_taux'] ?? 18;
        $tauxCSS = $taxesConfig->data['css_taux'] ?? 1;

        // Calculer selon la catégorie
        if ($facture->categorie === 'non_assujetti') {
            $montantTVA = 0;
            $montantCSS = 0;
        } else {
            $montantTVA = $montantHT * ($tauxTVA / 100);
            $montantCSS = $montantHT * ($tauxCSS / 100);
        }

        $montantTTC = $montantHT + $montantTVA + $montantCSS;

        $facture->update([
            'montant_ht' => $montantHT,
            'montant_tva' => $montantTVA,
            'montant_css' => $montantCSS,
            'montant_ttc' => $montantTTC,
        ]);
        
        Log::info('Totaux facture calculés', [
            'facture_id' => $facture->id,
            'montant_ht' => $montantHT,
            'montant_ttc' => $montantTTC,
        ]);
    }

    /**
     * Générer un numéro de facture unique
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
            
            $prefixe = $config->data['prefixe_facture'] ?? 'FAC';

            // Trouver le numéro maximum existant
            $maxNumero = Facture::withTrashed()
                ->where('numero', 'like', $prefixe . '-' . $annee . '-%')
                ->selectRaw("MAX(CAST(SUBSTRING_INDEX(numero, '-', -1) AS UNSIGNED)) as max_num")
                ->value('max_num');

            $prochainNumero = ($maxNumero ?? 0) + 1;

            // S'assurer que le numéro est au moins égal au compteur stocké
            $compteurStocke = $config->data['prochain_numero_facture'] ?? 1;
            if ($prochainNumero < $compteurStocke) {
                $prochainNumero = $compteurStocke;
            }

            // Vérifier l'unicité
            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            while (Facture::withTrashed()->where('numero', $numero)->exists()) {
                $prochainNumero++;
                $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);
            }

            // Mettre à jour le compteur
            $data = $config->data;
            $data['prochain_numero_facture'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return $numero;
        });
    }

    /**
     * Mettre à jour le solde d'un client
     */
    public function mettreAJourSoldeClient(int $clientId): void
    {
        $client = Client::find($clientId);
        if (!$client) return;

        $totalFactures = Facture::where('client_id', $clientId)
            ->whereNotIn('statut', ['annulee'])
            ->sum('montant_ttc');

        $totalPaye = Facture::where('client_id', $clientId)
            ->whereNotIn('statut', ['annulee'])
            ->sum('montant_paye');

        $client->update([
            'solde' => $totalFactures - $totalPaye,
        ]);
    }

    /**
     * Créer les lignes d'une facture
     */
    protected function creerLignes(Facture $facture, array $lignes): void
    {
        foreach ($lignes as $ligne) {
            $facture->lignes()->create($ligne);
        }
    }

    /**
     * Créer les conteneurs d'une facture avec leurs opérations
     */
    protected function creerConteneurs(Facture $facture, array $conteneurs): void
    {
        foreach ($conteneurs as $conteneurData) {
            $operations = $conteneurData['operations'] ?? [];
            unset($conteneurData['operations']);

            $conteneur = $facture->conteneurs()->create($conteneurData);

            foreach ($operations as $operation) {
                $conteneur->operations()->create($operation);
            }
        }
    }

    /**
     * Créer les lots d'une facture
     */
    protected function creerLots(Facture $facture, array $lots): void
    {
        foreach ($lots as $lot) {
            $facture->lots()->create($lot);
        }
    }
}
