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
        'rembourse',
        'montant_rembourse',
        'date_remboursement',
        'solde_avoir',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date' => 'date',
        'avoir_genere' => 'boolean',
        'rembourse' => 'boolean',
        'montant_rembourse' => 'decimal:2',
        'date_remboursement' => 'date',
        'solde_avoir' => 'decimal:2',
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

    public static function genererNumeroAvoir(): string
    {
        $annee = date('Y');

        return \Illuminate\Support\Facades\DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();

            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'] ?? [
                        'prefixe_avoir' => 'AV',
                        'prochain_numero_avoir' => 1,
                    ],
                ]);
            }

            $data = $config->data;
            $prefixe = $data['prefixe_avoir'] ?? 'AV';

            $prochainNumero = $data['prochain_numero_avoir'] ?? 1;
            $numero = sprintf('%s-%s-%04d', $prefixe, $annee, $prochainNumero);

            $data['prochain_numero_avoir'] = $prochainNumero + 1;
            $config->data = $data;
            $config->save();

            return $numero;
        });
    }
}
