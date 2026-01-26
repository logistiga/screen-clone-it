<?php

namespace App\Services;

use App\Models\NoteDebut;
use App\Models\LigneNoteDebut;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service pour la gestion des Notes de Débit.
 * Optimisé avec délégation au modèle pour les calculs.
 * NOTE: Les notes de début n'ont AUCUNE taxe (TVA=0, CSS=0)
 */
class NoteDebutService
{
    /**
     * Créer une nouvelle note de débit avec possibilité de lignes multiples
     */
    public function creer(array $data): NoteDebut
    {
        return DB::transaction(function () use ($data) {
            // Normaliser et générer le numéro
            $typeNormalise = NoteDebut::normaliserType($data['type'] ?? 'detention');
            $data['numero'] = NoteDebut::genererNumero($typeNormalise);
            $data['statut'] = $data['statut'] ?? 'brouillon';
            $data['date_creation'] = $data['date_creation'] ?? now()->toDateString();

            // Extraire les lignes si présentes
            $lignesData = $data['lignes'] ?? null;
            unset($data['lignes']);

            // Si pas de lignes mais montant_ht fourni via paramètres classiques
            if (!$lignesData && !isset($data['montant_ht']) && isset($data['nombre_jours'], $data['tarif_journalier'])) {
                $data['montant_ht'] = $data['nombre_jours'] * $data['tarif_journalier'];
            }

            // Notes de début : AUCUNE taxe
            $data['montant_tva'] = 0;
            $data['montant_css'] = 0;
            $data['taux_tva'] = 0;
            $data['taux_css'] = 0;
            
            if (isset($data['montant_ht'])) {
                $data['montant_ttc'] = $data['montant_ht'];
                $data['montant_total'] = $data['montant_ht'];
            }

            // Créer la note
            $note = NoteDebut::create($data);

            // Si lignes fournies, les créer et recalculer le total
            if ($lignesData && is_array($lignesData) && count($lignesData) > 0) {
                $this->creerLignes($note, $lignesData);
                $note->recalculerDepuisLignes();
            } else {
                // Calculer les totaux via le modèle (sans taxes)
                $note->calculerTotaux();
            }

            Log::info('Note de débit créée', [
                'note_id' => $note->id,
                'numero' => $note->numero,
                'type' => $typeNormalise,
                'nb_lignes' => $lignesData ? count($lignesData) : 0,
            ]);

            return $note->fresh(['client', 'transitaire', 'armateur', 'lignes']);
        });
    }

    /**
     * Créer les lignes d'une note
     */
    protected function creerLignes(NoteDebut $note, array $lignesData): void
    {
        foreach ($lignesData as $ligneData) {
            $ligne = new LigneNoteDebut([
                'note_debut_id' => $note->id,
                'ordre_id' => $ligneData['ordre_id'] ?? null,
                'conteneur_numero' => $ligneData['conteneur_numero'] ?? null,
                'bl_numero' => $ligneData['bl_numero'] ?? null,
                'date_debut' => $ligneData['date_debut'] ?? null,
                'date_fin' => $ligneData['date_fin'] ?? null,
                'tarif_journalier' => $ligneData['tarif_journalier'] ?? 0,
                'observations' => $ligneData['observations'] ?? null,
            ]);
            
            // Calculer nombre de jours et montant
            $ligne->calculerTotaux();
        }
    }

    /**
     * Modifier une note de débit existante
     */
    public function modifier(NoteDebut $note, array $data): NoteDebut
    {
        return DB::transaction(function () use ($note, $data) {
            // Extraire les lignes si présentes
            $lignesData = $data['lignes'] ?? null;
            unset($data['lignes']);

            // Si des lignes sont fournies, on les gère
            if ($lignesData && is_array($lignesData) && count($lignesData) > 0) {
                $this->syncLignes($note, $lignesData);
                
                // Mettre à jour les infos générales de la note
                $note->update($data);
                
                // Recalculer depuis les lignes
                $note->recalculerDepuisLignes();
            } else {
                // Modification simple (sans lignes)
                // Recalculer montant_ht si paramètres changent
                if (isset($data['nombre_jours']) || isset($data['tarif_journalier'])) {
                    if (!isset($data['montant_ht'])) {
                        $nombreJours = $data['nombre_jours'] ?? $note->nombre_jours;
                        $tarifJournalier = $data['tarif_journalier'] ?? $note->tarif_journalier;
                        $data['montant_ht'] = $nombreJours * $tarifJournalier;
                    }
                }

                $note->update($data);

                // Recalculer totaux si nécessaire
                if (isset($data['nombre_jours']) || isset($data['tarif_journalier']) || isset($data['montant_ht'])) {
                    $note->calculerTotaux();
                }
            }

            Log::info('Note de débit modifiée', [
                'note_id' => $note->id,
                'nb_lignes' => $lignesData ? count($lignesData) : 0,
            ]);

            return $note->fresh(['client', 'transitaire', 'armateur', 'lignes']);
        });
    }

    /**
     * Synchroniser les lignes d'une note (ajouter, modifier, supprimer)
     */
    protected function syncLignes(NoteDebut $note, array $lignesData): void
    {
        $lignesExistantes = $note->lignes()->pluck('id')->toArray();
        $lignesAGarder = [];

        foreach ($lignesData as $ligneData) {
            if (!empty($ligneData['id'])) {
                // Modifier une ligne existante
                $ligne = LigneNoteDebut::find($ligneData['id']);
                if ($ligne && $ligne->note_debut_id == $note->id) {
                    $ligne->update([
                        'ordre_id' => $ligneData['ordre_id'] ?? null,
                        'conteneur_numero' => $ligneData['conteneur_numero'] ?? null,
                        'bl_numero' => $ligneData['bl_numero'] ?? null,
                        'date_debut' => $ligneData['date_debut'] ?? null,
                        'date_fin' => $ligneData['date_fin'] ?? null,
                        'tarif_journalier' => $ligneData['tarif_journalier'] ?? 0,
                        'observations' => $ligneData['observations'] ?? null,
                    ]);
                    $ligne->calculerTotaux();
                    $lignesAGarder[] = $ligne->id;
                }
            } else {
                // Créer une nouvelle ligne
                $ligne = new LigneNoteDebut([
                    'note_debut_id' => $note->id,
                    'ordre_id' => $ligneData['ordre_id'] ?? null,
                    'conteneur_numero' => $ligneData['conteneur_numero'] ?? null,
                    'bl_numero' => $ligneData['bl_numero'] ?? null,
                    'date_debut' => $ligneData['date_debut'] ?? null,
                    'date_fin' => $ligneData['date_fin'] ?? null,
                    'tarif_journalier' => $ligneData['tarif_journalier'] ?? 0,
                    'observations' => $ligneData['observations'] ?? null,
                ]);
                $ligne->calculerTotaux();
                $lignesAGarder[] = $ligne->id;
            }
        }

        // Supprimer les lignes qui ne sont plus dans la liste
        $lignesASupprimer = array_diff($lignesExistantes, $lignesAGarder);
        if (!empty($lignesASupprimer)) {
            LigneNoteDebut::whereIn('id', $lignesASupprimer)->delete();
        }
    }

    /**
     * Valider une note (passer de brouillon à validée)
     */
    public function valider(NoteDebut $note): NoteDebut
    {
        if ($note->statut !== 'brouillon') {
            throw new \Exception('Seules les notes en brouillon peuvent être validées.');
        }

        $note->update(['statut' => 'validee']);

        Log::info('Note de débit validée', ['note_id' => $note->id]);

        return $note;
    }

    /**
     * Dupliquer une note existante
     */
    public function dupliquer(NoteDebut $note): NoteDebut
    {
        $data = $note->only([
            'type', 'client_id', 'ordre_id', 'transitaire_id', 'armateur_id',
            'bl_numero', 'conteneur_numero', 'conteneur_type', 'conteneur_taille',
            'navire', 'date_arrivee', 'date_debut', 'date_fin',
            'date_debut_stockage', 'date_fin_stockage', 'jours_franchise',
            'nombre_jours', 'tarif_journalier', 'description', 'notes',
        ]);

        return $this->creer($data);
    }

    /**
     * Calculer le nombre de jours entre deux dates
     */
    public function calculerNombreJours(\DateTime $dateDebut, \DateTime $dateFin): int
    {
        return max(0, $dateDebut->diff($dateFin)->days);
    }

    /**
     * Obtenir les statistiques des notes (optimisé)
     */
    public function getStatistiques(array $filters = []): array
    {
        // Construire la requête de base avec scopes
        $query = NoteDebut::query()
            ->forClient($filters['client_id'] ?? null)
            ->ofType($filters['type'] ?? null)
            ->dateRange($filters['date_debut'] ?? null, $filters['date_fin'] ?? null);

        // Statistiques globales en une seule requête
        $stats = $query->selectRaw('
            COUNT(*) as total,
            COALESCE(SUM(montant_ht), 0) as montant_total,
            COALESCE(SUM(montant_ttc), 0) as montant_ttc_total
        ')->first();

        // Stats par type (requête séparée pour éviter conflit avec filtres)
        $parType = NoteDebut::selectRaw('type, COUNT(*) as nombre, COALESCE(SUM(montant_ht), 0) as montant')
            ->groupBy('type')
            ->get();

        // Stats par statut
        $parStatut = NoteDebut::selectRaw('statut, COUNT(*) as nombre')
            ->groupBy('statut')
            ->get();

        return [
            'total' => $stats->total ?? 0,
            'montant_total' => round($stats->montant_total ?? 0, 2),
            'montant_ttc_total' => round($stats->montant_ttc_total ?? 0, 2),
            'par_type' => $parType,
            'par_statut' => $parStatut,
        ];
    }
}
