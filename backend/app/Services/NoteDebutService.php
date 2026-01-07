<?php

namespace App\Services;

use App\Models\NoteDebut;
use App\Models\Configuration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NoteDebutService
{
    /**
     * Créer une nouvelle note de début
     */
    public function creer(array $data): NoteDebut
    {
        return DB::transaction(function () use ($data) {
            // Générer le numéro
            $data['numero'] = $this->genererNumero($data['type'] ?? 'surestarie');
            $data['statut'] = $data['statut'] ?? 'brouillon';

            // Calculer le montant si non fourni
            if (!isset($data['montant_ht']) && isset($data['nombre_jours']) && isset($data['tarif_journalier'])) {
                $data['montant_ht'] = $data['nombre_jours'] * $data['tarif_journalier'];
            }

            // Créer la note
            $note = NoteDebut::create($data);

            Log::info('Note de début créée', ['note_id' => $note->id, 'numero' => $note->numero]);

            return $note->fresh(['client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Mettre à jour une note de début
     */
    public function modifier(NoteDebut $note, array $data): NoteDebut
    {
        return DB::transaction(function () use ($note, $data) {
            // Recalculer le montant si les paramètres changent
            if ((isset($data['nombre_jours']) || isset($data['tarif_journalier'])) && !isset($data['montant_ht'])) {
                $nombreJours = $data['nombre_jours'] ?? $note->nombre_jours;
                $tarifJournalier = $data['tarif_journalier'] ?? $note->tarif_journalier;
                $data['montant_ht'] = $nombreJours * $tarifJournalier;
            }

            $note->update($data);

            Log::info('Note de début modifiée', ['note_id' => $note->id]);

            return $note->fresh(['client', 'transitaire', 'armateur']);
        });
    }

    /**
     * Valider une note de début
     */
    public function valider(NoteDebut $note): NoteDebut
    {
        if ($note->statut !== 'brouillon') {
            throw new \Exception('Seules les notes en brouillon peuvent être validées.');
        }

        $note->update(['statut' => 'validee']);

        Log::info('Note de début validée', ['note_id' => $note->id]);

        return $note;
    }

    /**
     * Dupliquer une note de début
     */
    public function dupliquer(NoteDebut $note): NoteDebut
    {
        $data = $note->toArray();
        unset($data['id'], $data['numero'], $data['created_at'], $data['updated_at']);
        $data['statut'] = 'brouillon';

        return $this->creer($data);
    }

    /**
     * Calculer le nombre de jours entre deux dates
     */
    public function calculerNombreJours(\DateTime $dateDebut, \DateTime $dateFin): int
    {
        $interval = $dateDebut->diff($dateFin);
        return max(0, $interval->days);
    }

    /**
     * Générer un numéro de note unique
     */
    public function genererNumero(string $type = 'surestarie'): string
    {
        $config = Configuration::first();
        
        $prefixes = [
            'surestarie' => $config->prefixe_note_surestarie ?? 'NS',
            'detention' => $config->prefixe_note_detention ?? 'ND',
            'reparation' => $config->prefixe_note_reparation ?? 'NR',
            'ouverture_port' => $config->prefixe_note_ouverture ?? 'NOP',
        ];

        $prefixe = $prefixes[$type] ?? 'NOTE';
        $annee = date('Y');
        
        $derniereNote = NoteDebut::where('type', $type)
            ->whereYear('created_at', $annee)
            ->orderBy('id', 'desc')
            ->first();

        $numero = $derniereNote ? intval(substr($derniereNote->numero, -4)) + 1 : 1;

        return sprintf('%s-%s-%04d', $prefixe, $annee, $numero);
    }

    /**
     * Obtenir les statistiques des notes
     */
    public function getStatistiques(array $filters = []): array
    {
        $query = NoteDebut::query();

        if (!empty($filters['client_id'])) {
            $query->where('client_id', $filters['client_id']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['date_debut'])) {
            $query->where('date_debut', '>=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $query->where('date_fin', '<=', $filters['date_fin']);
        }

        $total = $query->count();
        $montantTotal = $query->sum('montant_ht');

        $parType = NoteDebut::selectRaw('type, COUNT(*) as nombre, SUM(montant_ht) as montant')
            ->groupBy('type')
            ->get();

        $parStatut = NoteDebut::selectRaw('statut, COUNT(*) as nombre')
            ->groupBy('statut')
            ->get();

        return [
            'total' => $total,
            'montant_total' => $montantTotal,
            'par_type' => $parType,
            'par_statut' => $parStatut,
        ];
    }
}
