<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LigneNoteDebut extends Model
{
    use HasFactory;

    protected $table = 'lignes_notes_debut';

    protected $fillable = [
        'note_debut_id',
        'ordre_id',
        'conteneur_numero',
        'bl_numero',
        'date_debut',
        'date_fin',
        'nombre_jours',
        'tarif_journalier',
        'montant_ht',
        'observations',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'tarif_journalier' => 'decimal:2',
        'montant_ht' => 'decimal:2',
    ];

    // =========================================
    // RELATIONS
    // =========================================

    public function noteDebut()
    {
        return $this->belongsTo(NoteDebut::class, 'note_debut_id');
    }

    public function ordre()
    {
        return $this->belongsTo(OrdreTravail::class, 'ordre_id');
    }

    // =========================================
    // MÉTHODES DE CALCUL
    // =========================================

    /**
     * Calculer le nombre de jours entre date_debut et date_fin
     */
    public function calculerNombreJours(): int
    {
        if (!$this->date_debut || !$this->date_fin) {
            return 0;
        }

        $debut = \Carbon\Carbon::parse($this->date_debut);
        $fin = \Carbon\Carbon::parse($this->date_fin);
        
        return max(0, $fin->diffInDays($debut) + 1); // +1 car jour de début inclus
    }

    /**
     * Calculer le montant HT (jours × tarif)
     */
    public function calculerMontantHT(): float
    {
        $jours = $this->nombre_jours ?? $this->calculerNombreJours();
        $tarif = (float) ($this->tarif_journalier ?? 0);
        
        return $jours * $tarif;
    }

    /**
     * Calculer et sauvegarder les totaux de la ligne
     */
    public function calculerTotaux(): void
    {
        $this->nombre_jours = $this->calculerNombreJours();
        $this->montant_ht = round($this->calculerMontantHT(), 2);
        $this->save();
    }
}
