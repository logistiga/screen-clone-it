<?php

namespace Database\Seeders;

use App\Models\Configuration;
use Illuminate\Database\Seeder;

class ConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        Configuration::firstOrCreate(
            ['key' => 'numerotation'],
            [
                'data' => [
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
            ]
        );

        Configuration::firstOrCreate(
            ['key' => 'taxes'],
            [
                'data' => [
                    'tva_taux' => 18,
                    'tva_actif' => true,
                    'css_taux' => 1,
                    'css_actif' => true,
                ],
            ]
        );

        Configuration::firstOrCreate(
            ['key' => 'entreprise'],
            [
                'data' => [
                    'nom' => 'Logistiga',
                    'adresse' => 'Libreville, Gabon',
                    'telephone' => '',
                    'email' => 'contact@logistiga.com',
                    'rccm' => '',
                    'nif' => '',
                    'logo' => null,
                ],
            ]
        );
    }
}
