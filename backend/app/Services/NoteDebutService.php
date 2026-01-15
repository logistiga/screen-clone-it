<?php

namespace App\Services;

use App\Models\NoteDebut;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service pour la gestion des Notes de Débit.
 * Optimisé avec délégation au modèle pour les calculs.
 */
class NoteDebutService
{
    /**
     * Créer une nouvelle note de débit
     */
    public function creer(array $data): NoteDebut
    {
        return DB::transaction(function () use ($data) {
            // Normaliser et générer le numéro
            $typeNormalise = NoteDebut::normaliserType($data['type'] ?? 'detention');
            $data['numero'] = NoteDebut::genererNumero($typeNormalise);
            $data['statut'] = $data['statut'] ?? 'brouillon';
            $data['date_creation'] = $data['date_creation'] ?? now()->toDateString();

            // Calculer montant_ht si non fourni
            if (!isset($data['montant_ht']) && isset($data['nombre_jours'], $data['tarif_journalier'])) {
                $data['montant_ht'] = $data['nombre_jours'] * $data['tarif_journalier'];
            }

            // Créer la note
            $note = NoteDebut::create($data);

            // Calculer les totaux (TVA, CSS, TTC) via le modèle
            $note->calculerTotaux();

            Log::info('Note de débit créée', [
                'note_id' => $note->id,
                'numero' => $note->numero,
                'type' => $typeNormalise,
            ]);

            return $note->fresh(['client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Modifier une note de débit existante
     */
    public function modifier(NoteDebut $note, array $data): NoteDebut
    {
        return DB::transaction(function () use ($note, $data) {
            // Recalculer montant_ht si paramètres changent
            $recalculer = false;
            
            if (isset($data['nombre_jours']) || isset($data['tarif_journalier'])) {
                if (!isset($data['montant_ht'])) {
                    $nombreJours = $data['nombre_jours'] ?? $note->nombre_jours;
                    $tarifJournalier = $data['tarif_journalier'] ?? $note->tarif_journalier;
                    $data['montant_ht'] = $nombreJours * $tarifJournalier;
                }
                $recalculer = true;
            }

            $note->update($data);

            // Recalculer totaux si nécessaire
            if ($recalculer || isset($data['montant_ht'])) {
                $note->calculerTotaux();
            }

            Log::info('Note de débit modifiée', ['note_id' => $note->id]);

            return $note->fresh(['client', 'transitaire', 'armateur']);
        });
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
