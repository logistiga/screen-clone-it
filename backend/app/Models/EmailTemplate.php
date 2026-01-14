<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'type',
        'objet',
        'contenu',
        'variables',
        'actif',
        'created_by',
    ];

    protected $casts = [
        'variables' => 'array',
        'actif' => 'boolean',
    ];

    /**
     * Types de templates disponibles
     */
    public const TYPES = [
        'devis' => 'Devis',
        'ordre' => 'Ordre de travail',
        'facture' => 'Facture',
        'relance' => 'Relance',
        'confirmation' => 'Confirmation',
        'notification' => 'Notification',
        'custom' => 'Personnalisé',
    ];

    /**
     * Relation avec l'utilisateur créateur
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation avec les automatisations
     */
    public function automations()
    {
        return $this->hasMany(EmailAutomation::class, 'template_id');
    }

    /**
     * Scope pour les templates actifs
     */
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    /**
     * Scope par type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Extraire les variables du contenu
     */
    public function extractVariables(): array
    {
        $variables = [];
        $fullText = $this->objet . ' ' . $this->contenu;
        
        preg_match_all('/\{\{(\w+)\}\}/', $fullText, $matches);
        
        if (!empty($matches[1])) {
            $variables = array_unique($matches[1]);
        }
        
        return array_values($variables);
    }

    /**
     * Rendre le template avec des données
     */
    public function render(array $data): array
    {
        $objet = $this->objet;
        $contenu = $this->contenu;

        foreach ($data as $key => $value) {
            $placeholder = '{{' . $key . '}}';
            $objet = str_replace($placeholder, $value, $objet);
            $contenu = str_replace($placeholder, $value, $contenu);
        }

        return [
            'objet' => $objet,
            'contenu' => $contenu,
        ];
    }
}
