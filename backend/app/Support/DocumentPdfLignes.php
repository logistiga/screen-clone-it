<?php

namespace App\Support;

use Illuminate\Support\Collection;

/**
 * Construit les lignes affichées dans les PDF officiels (Devis, OT, Facture),
 * à l'identique des PDF générés dans l'application. Lecture seule.
 */
class DocumentPdfLignes
{
    public static function build($doc, ?Collection $lotsOrdre = null): array
    {
        $cat = DocumentCategory::normalize($doc->categorie ?? null);
        $conteneurs = collect($doc->conteneurs ?? []);
        $lots = collect($doc->lots ?? []);
        $lignes = collect($doc->lignes ?? []);
        $lotsOrdre = $lotsOrdre ?? collect();

        if ($conteneurs->isNotEmpty() && $cat !== DocumentCategory::CONVENTIONNEL) {
            return ['type' => 'conteneurs', 'rows' => self::conteneurs($conteneurs)];
        }
        $source = $lots->isNotEmpty() ? $lots : $lotsOrdre;
        if ($source->isNotEmpty() && ($cat === DocumentCategory::CONVENTIONNEL || $lignes->isEmpty())) {
            return ['type' => 'lots', 'rows' => self::lots($source, $lotsOrdre)];
        }
        return ['type' => 'lignes', 'rows' => self::lignes($lignes)];
    }

    private static function conteneurs(Collection $conteneurs): array
    {
        $rows = [];
        $n = 0;
        foreach ($conteneurs as $c) {
            $n++;
            $pu = (float) ($c->prix_unitaire ?? 0);
            $rows[] = ['op' => false, 'n' => $n, 'numero' => $c->numero ?? '', 'taille' => $c->taille ?? '',
                'description' => $c->description ?? '', 'quantite' => 1, 'pu' => $pu, 'montant' => $pu];
            foreach (collect($c->operations ?? []) as $op) {
                $q = (float) ($op->quantite ?? 1);
                $p = (float) ($op->prix_unitaire ?? 0);
                $label = $op->type_operation ?? $op->type ?? 'Opération';
                $rows[] = ['op' => true, 'description' => '• ' . $label . (!empty($op->description) ? ' — ' . $op->description : ''),
                    'quantite' => $q, 'pu' => $p, 'montant' => (float) ($op->prix_total ?? $op->montant_ht ?? $q * $p)];
            }
        }
        return $rows;
    }

    private static function lots(Collection $lots, Collection $lotsOrdre): array
    {
        $norm = fn ($v) => ltrim(preg_replace('/[^a-z0-9]+/', '', strtolower((string) $v)) ?? '', 'lot');
        $generique = fn ($t) => trim((string) $t) === '' || preg_match('/^lots?[\s_-]*\d+$/i', trim((string) $t)) === 1;
        $rows = [];
        foreach ($lots->values() as $i => $l) {
            $num = $l->numero_lot ?? ('Lot ' . ($i + 1));
            $desig = trim((string) ($l->designation ?? $l->description ?? ''));
            if ($generique($desig) && $lotsOrdre->isNotEmpty()) {
                $src = $lotsOrdre->first(fn ($o) => $norm($o->numero_lot ?? '') === $norm($num)) ?? $lotsOrdre->values()->get($i);
                $desig = trim((string) ($src->description ?? '')) ?: $desig;
            }
            $q = (float) ($l->quantite ?? 1);
            $p = (float) ($l->prix_unitaire ?? 0);
            $stocke = (float) ($l->montant_ht ?? $l->prix_total ?? 0);
            $rows[] = ['description' => ($desig !== '' && $desig !== $num) ? "{$num} — {$desig}" : $num,
                'quantite' => $q, 'pu' => $p, 'montant' => $stocke > 0 ? $stocke : $q * $p];
        }
        return $rows;
    }

    private static function lignes(Collection $lignes): array
    {
        $modes = ['aller_retour' => 'Aller-retour', 'retour_simple' => 'Retour simple', 'aller_simple' => 'Aller simple'];
        $rows = [];
        foreach ($lignes as $l) {
            $trajet = null;
            if (($l->type_operation ?? '') === 'transport') {
                $dep = $l->point_depart ?? $l->lieu_depart ?? null;
                $arr = $l->point_arrivee ?? $l->lieu_arrivee ?? null;
                $mode = $modes[strtolower((string) ($l->mode_trajet ?? ''))] ?? '';
                if ($dep || $arr) {
                    $trajet = 'Trajet : ' . ($dep ?: '—') . ' → ' . ($arr ?: '—') . ($mode ? " ({$mode})" : '');
                }
            }
            $q = (float) ($l->quantite ?? 1);
            $p = (float) ($l->prix_unitaire ?? 0);
            $rows[] = ['description' => trim((string) ($l->description ?? '')) ?: ($l->type_operation ?? 'Prestation'),
                'trajet' => $trajet, 'quantite' => $q, 'pu' => $p, 'montant' => (float) ($l->montant_ht ?? $q * $p)];
        }
        return $rows;
    }
}
