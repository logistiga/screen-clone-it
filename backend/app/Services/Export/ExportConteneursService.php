<?php

namespace App\Services\Export;

use App\Models\ConteneurTraite;
use App\Models\ConteneurOrdre;
use App\Models\OperationConteneurOrdre;
use Illuminate\Support\Collection;

/**
 * Export CSV/Données des conteneurs traités (livrés / facturés)
 */
class ExportConteneursService
{
    use ExportHelpersTrait;

    /**
     * Charge les conteneurs filtrés + calcule le prix par conteneur.
     * Le prix = prix_unitaire (conteneurs_ordres) + somme(operations_conteneurs_ordres.prix_total)
     * Match : conteneurs_traites.ordre_travail_id <-> conteneurs_ordres.ordre_id + numero égal.
     *
     * @return array{rows: Collection, stats: array}
     */
    public function fetch(array $filters = []): array
    {
        $query = ConteneurTraite::query();

        if (!empty($filters['date_debut'])) {
            $query->where('date_sortie', '>=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $query->where('date_sortie', '<=', $filters['date_fin']);
        }
        if (!empty($filters['statut'])) {
            $query->where('statut', $filters['statut']);
        } else {
            // par défaut : on exclut les ignorés
            $query->where('statut', '!=', 'ignore');
        }
        if (!empty($filters['armateur_code'])) {
            $query->where('armateur_code', $filters['armateur_code']);
        }
        if (!empty($filters['type_conteneur'])) {
            $query->where('type_conteneur', $filters['type_conteneur']);
        }

        $conteneurs = $query->orderBy('date_sortie', 'desc')
            ->orderBy('numero_conteneur')
            ->get();

        // Pré-calcul des prix : on récupère toutes les lignes conteneurs_ordres concernées
        $ordreIds = $conteneurs->pluck('ordre_travail_id')->filter()->unique()->values();
        $numeros = $conteneurs->pluck('numero_conteneur')->filter()->unique()->values();

        $lignesOrdre = collect();
        $operations = collect();
        if ($ordreIds->isNotEmpty() && $numeros->isNotEmpty()) {
            $lignesOrdreFlat = ConteneurOrdre::whereIn('ordre_id', $ordreIds)
                ->whereIn('numero', $numeros)
                ->get();

            $lignesOrdre = $lignesOrdreFlat->groupBy(fn ($l) => $l->ordre_id . '|' . $l->numero);

            $ligneIds = $lignesOrdreFlat->pluck('id')->filter()->values();
            if ($ligneIds->isNotEmpty()) {
                $operations = OperationConteneurOrdre::whereIn('conteneur_id', $ligneIds)
                    ->get()->groupBy('conteneur_id');
            }
        }

        $rows = $conteneurs->map(function (ConteneurTraite $c) use ($lignesOrdre, $operations) {
            $prix = 0.0;
            if ($c->ordre_travail_id && $c->numero_conteneur) {
                $key = $c->ordre_travail_id . '|' . $c->numero_conteneur;
                $matches = $lignesOrdre->get($key, collect());
                foreach ($matches as $ligne) {
                    $prix += (float) ($ligne->prix_unitaire ?? 0);
                    $ops = $operations->get($ligne->id, collect());
                    $prix += (float) $ops->sum('prix_total');
                }
            }

            return (object) [
                'id' => $c->id,
                'numero_conteneur' => $c->numero_conteneur ?: '-',
                'client_nom' => $c->client_nom ?: '-',
                'type_conteneur' => $c->type_conteneur ?: '-',
                'numero_bl' => $c->numero_bl ?: '-',
                'armateur_nom' => $c->armateur_nom ?: ($c->armateur_code ?: '-'),
                'camion_plaque' => $c->camion_plaque ?: '-',
                'chauffeur_nom' => $c->chauffeur_nom ?: '-',
                'date_sortie' => $c->date_sortie,
                'date_retour' => $c->date_retour,
                'statut' => $c->statut,
                'statut_label' => $c->statut_label,
                'prix' => $prix,
            ];
        });

        $stats = [
            'total' => $rows->count(),
            'total_prix' => (float) $rows->sum('prix'),
            'nb_avec_prix' => $rows->where('prix', '>', 0)->count(),
            'nb_affectes' => $rows->where('statut', 'affecte')->count(),
            'nb_factures' => $rows->where('statut', 'facture')->count(),
            'nb_en_attente' => $rows->where('statut', 'en_attente')->count(),
        ];

        return ['rows' => $rows, 'stats' => $stats];
    }

    public function exportConteneursCSV(array $filters = []): string
    {
        $data = $this->fetch($filters);

        $headers = [
            'N° Conteneur', 'Client', 'Type', 'N° BL', 'Armateur',
            'N° Camion', 'Chauffeur', 'Date sortie', 'Date retour', 'Statut', 'Prix (FCFA)',
        ];

        $rows = $data['rows']->map(function ($c) {
            return [
                $c->numero_conteneur,
                $c->client_nom,
                $c->type_conteneur,
                $c->numero_bl,
                $c->armateur_nom,
                $c->camion_plaque,
                $c->chauffeur_nom,
                $c->date_sortie ? $c->date_sortie->format('d/m/Y') : '-',
                $c->date_retour ? $c->date_retour->format('d/m/Y') : '-',
                $this->formatStatut($c->statut),
                number_format($c->prix, 0, ',', ' '),
            ];
        });

        return $this->generateCSV($headers, $rows);
    }
}
