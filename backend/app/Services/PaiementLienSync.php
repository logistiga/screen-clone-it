<?php

namespace App\Services;

use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Support\FactureStatut;
use App\Services\Facture\FactureServiceFactory;

/**
 * Garde l'OT et sa facture alignés sur le montant payé :
 * un paiement (ou son annulation) sur l'un est reporté sur l'autre.
 * Appelé uniquement lors d'une opération de paiement, jamais en lecture.
 */
class PaiementLienSync
{
    public function __construct(protected FactureServiceFactory $factureFactory)
    {
    }

    /** Paiement porté sur une facture → reporter sur son OT. */
    public function depuisFacture(Facture $facture, float $delta): void
    {
        if (!$facture->ordre_id) return;
        $ordre = OrdreTravail::whereKey($facture->ordre_id)->lockForUpdate()->first();
        if (!$ordre) return;
        $ordre->update(['montant_paye' => max(0, round((float) $ordre->montant_paye + $delta))]);
    }

    /** Paiement porté sur un OT → reporter sur sa facture (non annulée). */
    public function depuisOrdre(OrdreTravail $ordre, float $delta): void
    {
        $facture = Facture::where('ordre_id', $ordre->id)
            ->whereNotIn('statut', FactureStatut::ALIAS_ANNULEE)
            ->lockForUpdate()->first();
        if (!$facture) return;
        $paye = max(0, round((float) $facture->montant_paye + $delta));
        $facture->update([
            'montant_paye' => $paye,
            'statut' => FactureStatut::pourMontants($paye, (float) $facture->montant_ttc, $facture->statut),
        ]);
        $this->factureFactory->mettreAJourSoldeClient($facture->client_id);
    }

    /** À la facturation d'un OT : la facture reprend ce qui a déjà été payé sur l'OT. */
    public function reprendrePaiementsOrdre(OrdreTravail $ordre, Facture $facture): void
    {
        $paye = round((float) $ordre->montant_paye);
        if ($paye <= 0) return;
        $facture->update([
            'montant_paye' => $paye,
            'statut' => FactureStatut::pourMontants($paye, (float) $facture->montant_ttc, $facture->statut),
        ]);
        $this->factureFactory->mettreAJourSoldeClient($facture->client_id);
    }
}
