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
        if (empty($facture->ordre_id)) {
            return;
        }

        $facture->loadMissing(['lots', 'ordreTravail.lots']);
        $ordre = $facture->ordreTravail;
        if (!$ordre || $ordre->lots->isEmpty()) {
            return;
        }

        if (!$this->estConventionnel($facture)) {
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
                'prix_total' => (float) ($lotOrdre->quantite ?? 1) * (float) ($lotOrdre->prix_unitaire ?? 0),
            ];

            $lotFacture = $this->trouverLotFacture($facture, (string) $payload['numero_lot'], $index);
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

    protected function estConventionnel(Facture $facture): bool
    {
        return DocumentCategory::isConventionnel($facture->categorie)
            || DocumentCategory::isConventionnel($facture->ordreTravail?->categorie)
            || $facture->lots->isNotEmpty();
    }

    protected function trouverLotFacture(Facture $facture, string $numeroLot, int $index)
    {
        $numeroNormalise = $this->normaliserNumeroLot($numeroLot);

        return $facture->lots->first(function ($lot) use ($numeroNormalise) {
            return $this->normaliserNumeroLot((string) ($lot->numero_lot ?? '')) === $numeroNormalise;
        }) ?? $facture->lots->values()->get($index);
    }

    protected function descriptionEstVideOuGenerique(?string $description): bool
    {
        $texte = trim((string) $description);

        return $texte === '' || preg_match('/^lots?[\s_-]*\d+$/i', $texte) === 1;
    }

    protected function normaliserNumeroLot(string $numeroLot): string
    {
        $texte = strtolower(trim($numeroLot));
        $texte = preg_replace('/[^a-z0-9]+/', '', $texte) ?? '';

        return str_starts_with($texte, 'lot') ? substr($texte, 3) : $texte;
    }
}