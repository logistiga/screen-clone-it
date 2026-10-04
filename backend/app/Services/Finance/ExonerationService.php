<?php

namespace App\Services\Finance;

use App\Traits\CalculeTotauxTrait;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Exonération TVA/CSS appliquée au moment du paiement.
 * Utilise le calcul commun (CalculeTotauxTrait::calculerTaxesDynamiques) : aucune formule à part.
 * Note : montant_ht stocké est déjà le HT APRÈS remise (cf. appliquerTotaux) — la remise n'est pas re-déduite.
 */
class ExonerationService
{
    use CalculeTotauxTrait;

    public function appliquer(Model $document, bool $exonereTva, bool $exonereCss, ?string $motif): Model
    {
        return DB::transaction(function () use ($document, $exonereTva, $exonereCss, $motif) {
            $doc = $document->newQuery()->lockForUpdate()->findOrFail($document->getKey());

            $selection = is_array($doc->taxes_selection) && array_key_exists('selected_tax_codes', $doc->taxes_selection)
                ? $doc->taxes_selection
                : $this->buildTaxesSelectionFromLegacy($doc);

            $exoCodes = array_values(array_filter([$exonereTva ? 'TVA' : null, $exonereCss ? 'CSS' : null]));
            $selection['has_exoneration'] = !empty($exoCodes);
            $selection['exonerated_tax_codes'] = $exoCodes;
            $selection['motif_exoneration'] = $motif ?? '';

            $htNet = (float) $doc->montant_ht;
            $taxes = $this->calculerTaxesDynamiques($htNet, $selection, $doc->categorie ?? null);
            $ttc = $taxes['total'] == 0 ? $htNet : $htNet + $taxes['total'];

            if (round($ttc) < round((float) ($doc->montant_paye ?? 0))) {
                throw new \DomainException('Exonération impossible : le montant déjà payé dépasserait le nouveau total.');
            }

            $doc->forceFill([
                'taxes_selection' => $selection,
                'exonere_tva' => $exonereTva,
                'exonere_css' => $exonereCss,
                'motif_exoneration' => $motif,
                'tva' => round($taxes['tva']),
                'css' => round($taxes['css']),
                'montant_ttc' => round($ttc),
            ])->save();

            return $doc->refresh();
        });
    }
}
