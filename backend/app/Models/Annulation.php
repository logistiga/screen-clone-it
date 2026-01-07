<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Annulation extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero',
        'type',
        'document_id',
        'document_numero',
        'client_id',
        'montant',
        'date',
        'motif',
        'avoir_genere',
        'numero_avoir',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date' => 'date',
        'avoir_genere' => 'boolean',
    ];

    // Relations
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    // Méthodes pour récupérer le document lié
    public function getDocumentAttribute()
    {
        return match($this->type) {
            'devis' => Devis::find($this->document_id),
            'ordre' => OrdreTravail::find($this->document_id),
            'facture' => Facture::find($this->document_id),
            default => null,
        };
    }

    public static function genererNumero()
    {
        $annee = date('Y');
        $dernier = self::whereYear('created_at', $annee)->count() + 1;
        return sprintf('ANN-%s-%04d', $annee, $dernier);
    }

    public static function genererNumeroAvoir()
    {
        $config = Configuration::getOrCreate('numerotation');
        $prefixe = $config->data['prefixe_avoir'] ?? 'AV';
        $annee = date('Y');
        $prochain = $config->data['prochain_numero_avoir'] ?? 1;

        $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochain);

        $config->data['prochain_numero_avoir'] = $prochain + 1;
        $config->save();

        return $numero;
    }
}
