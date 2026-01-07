<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nom',
        'email',
        'telephone',
        'adresse',
        'ville',
        'rccm',
        'nif',
        'solde',
    ];

    protected $casts = [
        'solde' => 'decimal:2',
    ];

    // Relations
    public function devis()
    {
        return $this->hasMany(Devis::class);
    }

    public function ordres()
    {
        return $this->hasMany(OrdreTravail::class);
    }

    public function factures()
    {
        return $this->hasMany(Facture::class);
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    // Méthodes
    public function calculerSolde()
    {
        $totalFactures = $this->factures()
            ->whereNotIn('statut', ['annulee'])
            ->sum('montant_ttc');
        
        $totalPaiements = $this->paiements()->sum('montant');
        
        $this->solde = $totalFactures - $totalPaiements;
        $this->save();
        
        return $this->solde;
    }

    public function getHistorique()
    {
        $devis = $this->devis()->with('lignes')->get()->map(fn($d) => [
            'type' => 'devis',
            'document' => $d,
            'date' => $d->created_at,
        ]);

        $ordres = $this->ordres()->with('lignes')->get()->map(fn($o) => [
            'type' => 'ordre',
            'document' => $o,
            'date' => $o->created_at,
        ]);

        $factures = $this->factures()->with('lignes')->get()->map(fn($f) => [
            'type' => 'facture',
            'document' => $f,
            'date' => $f->created_at,
        ]);

        $paiements = $this->paiements()->get()->map(fn($p) => [
            'type' => 'paiement',
            'document' => $p,
            'date' => $p->date,
        ]);

        return collect()
            ->merge($devis)
            ->merge($ordres)
            ->merge($factures)
            ->merge($paiements)
            ->sortByDesc('date')
            ->values();
    }
}
