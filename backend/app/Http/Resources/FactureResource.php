<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\DocumentCategory;

class FactureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Calculer les primes liées à cette facture
        $primeTransitaire = 0;
        $primeRepresentant = 0;
        
        if ($this->relationLoaded('primes')) {
            foreach ($this->primes as $prime) {
                if ($prime->transitaire_id) {
                    $primeTransitaire += (float) $prime->montant;
                }
                if ($prime->representant_id) {
                    $primeRepresentant += (float) $prime->montant;
                }
            }
        }

        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'date' => $this->date_creation?->toDateString(),
            'date_facture' => $this->date_creation?->toDateString(),
            'date_creation' => $this->date_creation?->toDateString(),
            'date_echeance' => $this->date_echeance?->toDateString(),
            'type_document' => DocumentCategory::toTypeDocument($this->categorie),
            'categorie' => DocumentCategory::normalize($this->categorie),
            'type_operation' => $this->type_operation,
            'type_operation_indep' => $this->type_operation_indep,
            'type_marchandise' => $this->type_marchandise,
            'description_generale' => $this->description_generale,
            'observation_interne' => $this->observation_interne,
            'statut' => $this->statut,
            
            // IDs partenaires
            'client_id' => $this->client_id,
            'ordre_id' => $this->ordre_id,
            'armateur_id' => $this->armateur_id,
            'transitaire_id' => $this->transitaire_id,
            'representant_id' => $this->representant_id,
            
            // Informations navire
            'bl_numero' => $this->numero_bl,
            'numero_bl' => $this->numero_bl,
            'navire' => $this->navire,
            
            // Montants - utiliser les colonnes de la DB (tva, css)
            'montant_ht' => round((float) $this->montant_ht, 2),
            'montant_tva' => round((float) $this->tva, 2),
            'montant_css' => round((float) $this->css, 2),
            'montant_ttc' => round((float) $this->montant_ttc, 2),
            'montant_paye' => round((float) $this->montant_paye, 2),
            'reste_a_payer' => round((float) ($this->montant_ttc - $this->montant_paye), 2),
            
            // Alias pour compatibilité
            'tva' => round((float) $this->tva, 2),
            'css' => round((float) $this->css, 2),
            'taux_tva' => $this->taux_tva,
            'taux_css' => $this->taux_css,
            
            // Remise
            'remise_type' => $this->remise_type,
            'remise_valeur' => (float) ($this->remise_valeur ?? 0),
            'remise_montant' => round((float) ($this->remise_montant ?? 0), 2),
            
            // Exonérations
            'exonere_tva' => (bool) $this->exonere_tva,
            'exonere_css' => (bool) $this->exonere_css,
            'motif_exoneration' => $this->motif_exoneration,
            'montant_effectif' => round((float) $this->montant_effectif, 2),
            'taxes_selection' => $this->taxes_selection,
            
            // Primes liées (calculées depuis la relation primes)
            'prime_transitaire' => round($primeTransitaire, 2),
            'prime_representant' => round($primeRepresentant, 2),
            
            // Envoi
            'date_envoi' => $this->date_envoi?->toISOString(),
            
            'notes' => $this->notes,
            'token_verification' => $this->token_verification,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Créateur
            'created_by' => $this->whenLoaded('createdBy', fn() => $this->createdBy ? [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ] : null),
            
            // Relations
            'client' => $this->whenLoaded('client', fn() => $this->client ? new ClientResource($this->client) : null),
            'armateur' => $this->whenLoaded('armateur', fn() => $this->armateur ? new ArmateurResource($this->armateur) : null),
            'transitaire' => $this->whenLoaded('transitaire', fn() => $this->transitaire ? new TransitaireResource($this->transitaire) : null),
            'representant' => $this->whenLoaded('representant', fn() => $this->representant ? new RepresentantResource($this->representant) : null),
            'ordre_travail' => $this->whenLoaded('ordreTravail', fn() => $this->ordreTravail ? new OrdreTravailResource($this->ordreTravail) : null),
            'lignes' => LigneFactureResource::collection($this->whenLoaded('lignes')),
            'conteneurs' => ConteneurFactureResource::collection($this->whenLoaded('conteneurs')),
            'lots' => $this->buildLotsAvecFallbackOrdre(),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
            'primes' => PrimeResource::collection($this->whenLoaded('primes')),
            'annulation' => $this->whenLoaded('annulation', fn() => $this->annulation ? [
                'id' => $this->annulation->id,
                'motif' => $this->annulation->motif,
                'avoir_genere' => (bool) $this->annulation->avoir_genere,
                'numero_avoir' => $this->annulation->numero_avoir,
                'date' => $this->annulation->created_at?->toDateString(),
            ] : null),
        ];
    }

    /**
     * Retourne les lots facture en injectant la désignation/prix depuis l'OT lié
     * lorsque le lot facture est vide ou porte un libellé générique (« Lot 1 », etc.).
     */
    protected function buildLotsAvecFallbackOrdre(): array
    {
        if (!$this->relationLoaded('lots')) {
            return [];
        }

        $ordreLots = collect();
        if ($this->relationLoaded('ordreTravail') && $this->ordreTravail && $this->ordreTravail->relationLoaded('lots')) {
            $ordreLots = $this->ordreTravail->lots;
        }

        $normalize = function (?string $numero): string {
            $texte = strtolower(trim((string) $numero));
            $texte = preg_replace('/[^a-z0-9]+/', '', $texte) ?? '';
            return str_starts_with($texte, 'lot') ? substr($texte, 3) : $texte;
        };

        $estGenerique = function (?string $texte): bool {
            $t = trim((string) $texte);
            return $t === '' || preg_match('/^lots?[\s_-]*\d+$/i', $t) === 1;
        };

        $lots = $this->lots->values();
        $result = [];
        foreach ($lots as $index => $lot) {
            $description = trim((string) ($lot->description ?? ''));
            $source = null;
            if ($ordreLots->isNotEmpty()) {
                $numLot = $normalize($lot->numero_lot);
                $source = $ordreLots->first(fn($ol) => $normalize($ol->numero_lot) === $numLot)
                    ?? $ordreLots->values()->get($index);
            }
            if ($source && $estGenerique($description)) {
                $srcTxt = trim((string) ($source->description ?? ''));
                if ($srcTxt !== '') {
                    $description = $srcTxt;
                }
            }

            $qte = (float) ($lot->quantite ?? ($source->quantite ?? 1));
            $pu = (float) ($lot->prix_unitaire ?? 0);
            if ($pu <= 0 && $source) {
                $pu = (float) ($source->prix_unitaire ?? 0);
            }
            $stocke = (float) ($lot->prix_total ?? 0);
            $prixTotal = $stocke > 0 ? $stocke : $qte * $pu;

            $result[] = [
                'id' => $lot->id,
                'numero_lot' => $lot->numero_lot,
                'designation' => $description,
                'description' => $description,
                'quantite' => $qte,
                'poids' => $lot->poids ?? null,
                'volume' => $lot->volume ?? null,
                'prix_unitaire' => round($pu, 2),
                'prix_total' => round($prixTotal, 2),
                'montant_ht' => round($prixTotal, 2),
            ];
        }

        // Si la facture n'a aucun lot mais l'OT en a, on expose ceux de l'OT
        if (empty($result) && $ordreLots->isNotEmpty()) {
            foreach ($ordreLots as $ol) {
                $qte = (float) ($ol->quantite ?? 1);
                $pu = (float) ($ol->prix_unitaire ?? 0);
                $prixTotal = (float) ($ol->prix_total ?? 0);
                if ($prixTotal <= 0) $prixTotal = $qte * $pu;
                $result[] = [
                    'id' => null,
                    'numero_lot' => $ol->numero_lot,
                    'designation' => trim((string) ($ol->description ?? '')),
                    'description' => trim((string) ($ol->description ?? '')),
                    'quantite' => $qte,
                    'poids' => $ol->poids ?? null,
                    'volume' => $ol->volume ?? null,
                    'prix_unitaire' => round($pu, 2),
                    'prix_total' => round($prixTotal, 2),
                    'montant_ht' => round($prixTotal, 2),
                ];
            }
        }

        return $result;
    }
}
