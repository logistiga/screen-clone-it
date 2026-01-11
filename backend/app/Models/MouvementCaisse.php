<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MouvementCaisse extends Model
{
    use HasFactory;

    protected $table = 'mouvements_caisse';

    protected $fillable = [
        'type',
        'montant',
        'date',
        'description',
        'paiement_id',
        'source',
        'banque_id',
        'categorie',
        'beneficiaire',
        'mode_paiement',
        'reference',
        'client_id',
        'annulation_id',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date' => 'date',
    ];

    // Relations
    public function paiement()
    {
        return $this->belongsTo(Paiement::class);
    }

    public function banque()
    {
        return $this->belongsTo(Banque::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function annulation()
    {
        return $this->belongsTo(Annulation::class);
    }

    // Scopes
    public function scopeEntrees($query)
    {
        return $query->where('type', 'entree');
    }

    public function scopeSorties($query)
    {
        return $query->where('type', 'sortie');
    }

    public function scopeCaisse($query)
    {
        return $query->where('source', 'caisse');
    }

    public function scopeBanque($query)
    {
        return $query->where('source', 'banque');
    }

    public function scopePeriode($query, $debut, $fin)
    {
        return $query->whereBetween('date', [$debut, $fin]);
    }

    // Méthodes statiques
    public static function getSoldeCaisse()
    {
        $entrees = self::caisse()->entrees()->sum('montant');
        $sorties = self::caisse()->sorties()->sum('montant');
        return $entrees - $sorties;
    }
}
