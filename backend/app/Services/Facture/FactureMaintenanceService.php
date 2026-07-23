<?php

namespace App\Services\Facture;

use App\Models\Annulation;
use App\Models\Facture;
use App\Support\DocumentCategory;
use Illuminate\Support\Facades\DB;

class FactureMaintenanceService
{
    public function synchroniserAnnulationsFactures(): void
    {
        $facturesAnnulees = Facture::where('statut', 'annulee')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('annulations')
                    ->whereColumn('annulations.document_id', 'factures.id')
                    ->where('annulations.type', 'facture');
            })
            ->get();

        foreach ($facturesAnnulees as $facture) {
            Annulation::create([
                'numero' => Annulation::genererNumero(),
                'type' => 'facture',
                'document_id' => $facture->id,
                'document_numero' => $facture->numero,
                'client_id' => $facture->client_id,
                'montant' => $facture->montant_ttc ?? 0,
                'date' => $facture->updated_at ?? now(),
                'motif' => 'Annulation enregistrée automatiquement',
                'avoir_genere' => true,
                'numero_avoir' => Annulation::genererNumeroAvoir(),
                'solde_avoir' => $facture->montant_ttc ?? 0,
            ]);
        }
    }

    public function reparerLotsConventionnelsDepuisOrdre(Facture $facture): void
    {
        if (!DocumentCategory::isConventionnel($facture->categorie) || empty($facture->ordre_id)) {
            return;
        }

        $facture->loadMissing(['lots', 'ordreTravail.lots']);
        $ordre = $facture->ordreTravail;
        if (!$ordre || $ordre->lots->isEmpty()) {
            return;
        }

        if (!$this->doitReparerLots($facture)) {
            return;
        }

        foreach ($ordre->lots->values() as $index => $lotOrdre) {
            $description = trim((string) ($lotOrdre->description ?? ''));
            if ($description === '') {
                continue;
            }

            $payload = [
                'numero_lot' => $lotOrdre->numero_lot ?: 'LOT-' . ($index + 1),
                'description' => $description,
                'quantite' => $lotOrdre->quantite ?? 1,
                'prix_unitaire' => $lotOrdre->prix_unitaire ?? 0,
            ];

            $lotFacture = $facture->lots->values()->get($index);
            if ($lotFacture && $this->descriptionEstVideOuGenerique($lotFacture->description)) {
                $lotFacture->update($payload);
                continue;
            }

            if (!$lotFacture) {
                $facture->lots()->create($payload);
            }
        }

        $facture->unsetRelation('lots');
        $facture->load('lots');
    }

    protected function doitReparerLots(Facture $facture): bool
    {
        return $facture->lots->isEmpty() || $facture->lots->contains(
            fn ($lot) => $this->descriptionEstVideOuGenerique($lot->description)
        );
    }

    protected function descriptionEstVideOuGenerique(?string $description): bool
    {
        $texte = trim((string) $description);

        return $texte === '' || preg_match('/^lot\s*\d+$/i', $texte) === 1;
    }
}