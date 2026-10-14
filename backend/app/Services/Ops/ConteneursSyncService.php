<?php

namespace App\Services\Ops;

use App\Models\Armateur;
use App\Models\ConteneurTraite;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Synchronisation incrémentale OPS → conteneurs_traites.
 * - Ne lit que les sorties modifiées depuis la dernière synchro réussie (si OPS a `updated_at`).
 * - Charge les conteneurs locaux existants par lots (une requête par 500 ids, pas une par ligne).
 * - N'écrit que si au moins une valeur a réellement changé.
 * Ne touche jamais statut / ordre_travail_id des lignes existantes (gérés côté FAC).
 */
class ConteneursSyncService
{
    private const CLE_REPERE = 'ops_sync_conteneurs_repere';
    private const MARGE_MINUTES = 10;
    private const LOT = 500;

    /** @return array{trouves:int,importes:int,mis_a_jour:int,inchanges:int,incremental:bool,erreurs:array<int,string>} */
    public function synchroniser(bool $complet = false): array
    {
        $debut = now();
        $hasUpdatedAt = Schema::connection('ops')->hasColumn('sortie_conteneurs', 'updated_at');
        $repere = (!$complet && $hasUpdatedAt) ? Cache::get(self::CLE_REPERE) : null;

        $lignes = $this->lireOps($repere);
        $stats = ['trouves' => $lignes->count(), 'importes' => 0, 'mis_a_jour' => 0, 'inchanges' => 0, 'incremental' => $repere !== null, 'erreurs' => []];
        $typesArmateurs = [];

        foreach ($lignes->chunk(self::LOT) as $lot) {
            $existants = ConteneurTraite::whereIn('sortie_id_externe', $lot->pluck('sortie_id_externe')->all())
                ->get()->keyBy('sortie_id_externe');

            foreach ($lot as $ops) {
                try {
                    $valeurs = $this->mapper($ops);
                    $local = $existants->get($ops->sortie_id_externe);
                    if (!$local) {
                        ConteneurTraite::create($valeurs + [
                            'sortie_id_externe' => $ops->sortie_id_externe,
                            'statut' => 'en_attente', 'source_system' => 'logistiga_ops', 'synced_at' => now(),
                        ]);
                        $stats['importes']++;
                    } elseif ($diff = $this->differences($local, $valeurs)) {
                        $local->update($diff + ['synced_at' => now()]);
                        $stats['mis_a_jour']++;
                    } else {
                        $stats['inchanges']++;
                    }
                    if (!empty($ops->type_conteneur) && !empty($ops->code_armateur)) {
                        $typesArmateurs[$ops->code_armateur] = $ops->type_conteneur;
                    }
                } catch (\Throwable $e) {
                    $stats['erreurs'][] = "Conteneur {$ops->numero_conteneur}: {$e->getMessage()}";
                }
            }
        }

        $this->majTypesArmateurs($typesArmateurs);

        // Le repère n'avance que si tout s'est bien passé (sinon on relira les mêmes lignes)
        if ($hasUpdatedAt && empty($stats['erreurs'])) {
            Cache::forever(self::CLE_REPERE, $debut->copy()->subMinutes(self::MARGE_MINUTES)->toDateTimeString());
        }
        Log::info('[ConteneursSync] Terminé', array_diff_key($stats, ['erreurs' => 1]) + ['nb_erreurs' => count($stats['erreurs'])]);
        return $stats;
    }

    private function lireOps(?string $repere)
    {
        $schema = Schema::connection('ops');
        $colParc = null;
        if ($schema->hasTable('camions')) {
            foreach (['parc', 'numero_parc', 'numero', 'plaque', 'immatriculation'] as $col) {
                if ($schema->hasColumn('camions', $col)) { $colParc = $col; break; }
            }
        }
        $q = DB::connection('ops')->table('sortie_conteneurs as sc')
            ->leftJoin('clients as c', 'sc.client_id', '=', 'c.id')
            ->leftJoin('armateurs as a', 'sc.armateur_id', '=', 'a.id')
            ->leftJoin('transitaires as t', 'sc.transitaire_id', '=', 't.id');
        $select = [
            'sc.id as sortie_id_externe', 'sc.numero_conteneur', 'sc.numero_bl', 'sc.type_conteneur',
            'c.nom as nom_client', 'a.code as code_armateur', 'a.nom as armateur_nom', 't.nom as nom_transitaire',
            'sc.camion_id', 'sc.remorque_id', 'sc.date_sortie', 'sc.date_retour', 'sc.prime_chauffeur',
            'sc.adresse_livraison', 'sc.destination', 'sc.type_transport', 'sc.statut as statut_ops',
        ];
        if ($colParc) {
            $q->leftJoin('camions as cam', 'sc.camion_id', '=', 'cam.id');
            $select[] = "cam.{$colParc} as camion_parc";
        }
        if ($repere) {
            $q->where('sc.updated_at', '>=', $repere);
        }
        return $q->select($select)->orderBy('sc.id')->get();
    }

    private function mapper(object $o): array
    {
        return [
            'numero_conteneur' => $o->numero_conteneur, 'numero_bl' => $o->numero_bl, 'type_conteneur' => $o->type_conteneur,
            'armateur_code' => $o->code_armateur, 'armateur_nom' => $o->armateur_nom, 'client_nom' => $o->nom_client,
            'client_adresse' => $o->adresse_livraison, 'transitaire_nom' => $o->nom_transitaire,
            'date_sortie' => $o->date_sortie, 'date_retour' => $o->date_retour,
            'camion_id_externe' => $o->camion_id, 'camion_plaque' => $o->camion_parc ?? null,
            'remorque_id_externe' => $o->remorque_id, 'prime_chauffeur' => $o->prime_chauffeur,
            'destination_type' => $o->destination, 'destination_adresse' => $o->adresse_livraison,
            'type_transport' => $o->type_transport ?? null, 'statut_ops' => $o->statut_ops,
        ];
    }

    private function differences(ConteneurTraite $local, array $valeurs): array
    {
        $diff = [];
        foreach ($valeurs as $champ => $nouveau) {
            if (!$this->egal($local->getRawOriginal($champ), $nouveau)) { $diff[$champ] = $nouveau; }
        }
        return $diff;
    }

    private function egal(mixed $a, mixed $b): bool
    {
        $a = ($a === null || trim((string) $a) === '') ? null : trim((string) $a);
        $b = ($b === null || trim((string) $b) === '') ? null : trim((string) $b);
        if ($a === null || $b === null) { return $a === $b; }
        if (is_numeric($a) && is_numeric($b)) { return (float) $a === (float) $b; }
        $re = '/^\d{4}-\d{2}-\d{2}/';
        if (preg_match($re, $a) && preg_match($re, $b)) { return strtotime($a) === strtotime($b); }
        return $a === $b;
    }

    /** Une requête par armateur concerné, et seulement si le type change. */
    private function majTypesArmateurs(array $types): void
    {
        if (!$types) { return; }
        foreach (Armateur::whereIn('code', array_keys($types))->get() as $arm) {
            $type = $types[$arm->code] ?? null;
            if ($type && $arm->type_conteneur !== $type) { $arm->update(['type_conteneur' => $type]); }
        }
    }
}
