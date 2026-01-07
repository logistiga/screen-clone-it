<?php

namespace Database\Seeders;

use App\Models\Armateur;
use App\Models\Banque;
use App\Models\Client;
use App\Models\Representant;
use App\Models\Transitaire;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Banques
        Banque::create([
            'nom' => 'BGFI Bank',
            'code' => 'BGFI',
            'adresse' => 'Boulevard de l\'Indépendance, Libreville',
            'telephone' => '+241 01 76 26 26',
            'email' => 'contact@bgfi.com',
            'iban' => 'GA21 4000 0000 0000 0000 0000 001',
            'swift' => 'BGFIGAXX',
            'solde' => 15000000,
            'principale' => true,
            'actif' => true,
        ]);

        Banque::create([
            'nom' => 'UGB Banque',
            'code' => 'UGB',
            'adresse' => 'Avenue du Commerce, Libreville',
            'telephone' => '+241 01 72 12 12',
            'email' => 'contact@ugb.ga',
            'iban' => 'GA21 4000 0000 0000 0000 0000 002',
            'swift' => 'UGBAGAXX',
            'solde' => 5000000,
            'principale' => false,
            'actif' => true,
        ]);

        // Clients
        Client::create([
            'code' => 'CLI-0001',
            'nom' => 'TOTAL Gabon',
            'type' => 'entreprise',
            'email' => 'contact@total-gabon.com',
            'telephone' => '+241 01 79 20 00',
            'adresse' => 'Port-Gentil, Gabon',
            'ville' => 'Port-Gentil',
            'pays' => 'Gabon',
            'nif' => 'NIF123456789',
            'rccm' => 'GA-LBV-01-2020-A12345',
            'limite_credit' => 50000000,
            'actif' => true,
        ]);

        Client::create([
            'code' => 'CLI-0002',
            'nom' => 'Ciments du Gabon',
            'type' => 'entreprise',
            'email' => 'contact@cimgabon.com',
            'telephone' => '+241 01 70 30 30',
            'adresse' => 'Zone Industrielle, Owendo',
            'ville' => 'Libreville',
            'pays' => 'Gabon',
            'nif' => 'NIF987654321',
            'rccm' => 'GA-LBV-01-2019-B54321',
            'limite_credit' => 30000000,
            'actif' => true,
        ]);

        Client::create([
            'code' => 'CLI-0003',
            'nom' => 'SETRAG',
            'type' => 'entreprise',
            'email' => 'contact@setrag.ga',
            'telephone' => '+241 01 70 05 05',
            'adresse' => 'Gare ferroviaire, Owendo',
            'ville' => 'Libreville',
            'pays' => 'Gabon',
            'nif' => 'NIF456789123',
            'limite_credit' => 25000000,
            'actif' => true,
        ]);

        Client::create([
            'code' => 'CLI-0004',
            'nom' => 'Société Gabonaise de Transport',
            'type' => 'entreprise',
            'email' => 'info@sgt-gabon.com',
            'telephone' => '+241 01 44 55 66',
            'adresse' => 'Boulevard Triomphal, Libreville',
            'ville' => 'Libreville',
            'pays' => 'Gabon',
            'limite_credit' => 10000000,
            'actif' => true,
        ]);

        Client::create([
            'code' => 'CLI-0005',
            'nom' => 'Jean-Pierre Moussavou',
            'type' => 'particulier',
            'email' => 'jp.moussavou@email.com',
            'telephone' => '+241 06 12 34 56',
            'adresse' => 'Quartier Glass, Libreville',
            'ville' => 'Libreville',
            'pays' => 'Gabon',
            'limite_credit' => 1000000,
            'actif' => true,
        ]);

        // Transitaires
        Transitaire::create([
            'code' => 'TRA-0001',
            'nom' => 'Transit Express Gabon',
            'email' => 'contact@transitexpress.ga',
            'telephone' => '+241 01 44 11 22',
            'adresse' => 'Port d\'Owendo, Libreville',
            'taux_commission' => 2.5,
            'actif' => true,
        ]);

        Transitaire::create([
            'code' => 'TRA-0002',
            'nom' => 'Africa Transit SARL',
            'email' => 'info@africatransit.com',
            'telephone' => '+241 01 44 33 44',
            'adresse' => 'Zone Portuaire, Owendo',
            'taux_commission' => 3.0,
            'actif' => true,
        ]);

        Transitaire::create([
            'code' => 'TRA-0003',
            'nom' => 'Global Freight Gabon',
            'email' => 'contact@globalfreight.ga',
            'telephone' => '+241 01 44 55 66',
            'adresse' => 'Aéroport Léon Mba, Libreville',
            'taux_commission' => 2.0,
            'actif' => true,
        ]);

        // Représentants
        Representant::create([
            'code' => 'REP-0001',
            'nom' => 'Représentations Maritimes du Gabon',
            'email' => 'contact@rmg.ga',
            'telephone' => '+241 01 55 11 22',
            'adresse' => 'Port d\'Owendo',
            'taux_commission' => 1.5,
            'actif' => true,
        ]);

        Representant::create([
            'code' => 'REP-0002',
            'nom' => 'Coastal Shipping Services',
            'email' => 'info@coastal.ga',
            'telephone' => '+241 01 55 33 44',
            'adresse' => 'Boulevard Maritime, Libreville',
            'taux_commission' => 2.0,
            'actif' => true,
        ]);

        // Armateurs
        Armateur::create([
            'code' => 'ARM-0001',
            'nom' => 'Maersk Line',
            'email' => 'gabon@maersk.com',
            'telephone' => '+241 01 66 11 22',
            'adresse' => 'Port d\'Owendo, Libreville',
            'actif' => true,
        ]);

        Armateur::create([
            'code' => 'ARM-0002',
            'nom' => 'MSC - Mediterranean Shipping Company',
            'email' => 'gabon@msc.com',
            'telephone' => '+241 01 66 33 44',
            'adresse' => 'Zone Portuaire, Owendo',
            'actif' => true,
        ]);

        Armateur::create([
            'code' => 'ARM-0003',
            'nom' => 'CMA CGM',
            'email' => 'libreville@cma-cgm.com',
            'telephone' => '+241 01 66 55 66',
            'adresse' => 'Port d\'Owendo',
            'actif' => true,
        ]);

        Armateur::create([
            'code' => 'ARM-0004',
            'nom' => 'Grimaldi Lines',
            'email' => 'gabon@grimaldi.com',
            'telephone' => '+241 01 66 77 88',
            'adresse' => 'Terminal Roulier, Owendo',
            'actif' => true,
        ]);
    }
}
