<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailAutomation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'declencheur',
        'template_id',
        'delai',
        'delai_unite',
        'actif',
        'conditions',
        'created_by',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'delai' => 'integer',
    ];

    /**
     * Déclencheurs disponibles
     */
    public const DECLENCHEURS = [
        'creation_devis' => 'Création d\'un devis',
        'creation_ordre' => 'Création d\'un ordre de travail',
        'creation_facture' => 'Création d\'une facture',
        'facture_impayee' => 'Facture impayée (après échéance)',
        'paiement_recu' => 'Paiement reçu',
        'ordre_termine' => 'Ordre de travail terminé',
        'devis_accepte' => 'Devis accepté',
        'devis_expire' => 'Devis expiré',
    ];

    /**
     * Unités de délai
     */
    public const DELAI_UNITES = [
        'minutes' => 'Minutes',
        'heures' => 'Heures',
        'jours' => 'Jours',
    ];

    /**
     * Relation avec le template
     */
    public function template()
    {
        return $this->belongsTo(EmailTemplate::class, 'template_id');
    }

    /**
     * Relation avec l'utilisateur créateur
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope pour les automatisations actives
     */
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    /**
     * Scope par déclencheur
     */
    public function scopeForDeclencheur($query, string $declencheur)
    {
        return $query->where('declencheur', $declencheur);
    }

    /**
     * Calculer le délai en secondes
     */
    public function getDelaiEnSecondesAttribute(): int
    {
        return match ($this->delai_unite) {
            'minutes' => $this->delai * 60,
            'heures' => $this->delai * 3600,
            'jours' => $this->delai * 86400,
            default => $this->delai * 60,
        };
    }

    /**
     * Vérifier si l'automatisation est immédiate
     */
    public function isImmediate(): bool
    {
        return $this->delai === 0;
    }
}
