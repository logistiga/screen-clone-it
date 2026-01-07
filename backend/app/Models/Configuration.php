<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Configuration extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    // Configurations par défaut
    const DEFAULTS = [
        'numerotation' => [
            'prefixe_devis' => 'DEV',
            'prefixe_ordre' => 'OT',
            'prefixe_facture' => 'FAC',
            'prefixe_avoir' => 'AV',
            'format_annee' => true,
            'prochain_numero_devis' => 1,
            'prochain_numero_ordre' => 1,
            'prochain_numero_facture' => 1,
            'prochain_numero_avoir' => 1,
        ],
        'taxes' => [
            'tva_taux' => 18,
            'tva_actif' => true,
            'css_taux' => 1,
            'css_actif' => true,
        ],
        'entreprise' => [
            'nom' => 'Logistiga',
            'adresse' => '',
            'telephone' => '',
            'email' => '',
            'rccm' => '',
            'nif' => '',
            'logo' => null,
        ],
    ];

    // Méthodes statiques
    public static function getOrCreate($key)
    {
        $config = self::where('key', $key)->first();
        
        if (!$config) {
            $config = self::create([
                'key' => $key,
                'data' => self::DEFAULTS[$key] ?? [],
            ]);
        }
        
        return $config;
    }

    public static function getValue($key, $subKey = null)
    {
        $config = self::getOrCreate($key);
        
        if ($subKey) {
            return $config->data[$subKey] ?? null;
        }
        
        return $config->data;
    }

    public static function setValue($key, $subKey, $value)
    {
        $config = self::getOrCreate($key);
        $data = $config->data;
        $data[$subKey] = $value;
        $config->data = $data;
        $config->save();
        
        return $config;
    }
}
