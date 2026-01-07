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
        // Banques (colonnes: nom, numero_compte, rib, iban, swift, solde, actif)
        Banque::create([
            'nom' => 'BGFI Bank',
            'numero_compte' => '0001-0000-0001',
            'rib' => 'BGFI001',
            'iban' => 'GA21 4000 0000 0000 0000 0000 001',
            'swift' => 'BGFIGAXX',
            'solde' => 15000000,
            'actif' => true,
        ]);

        Banque::create([
            'nom' => 'UGB Banque',
            'numero_compte' => '0002-0000-0001',
            'rib' => 'UGB001',
            'iban' => 'GA21 4000 0000 0000 0000 0000 002',
            'swift' => 'UGBAGAXX',
            'solde' => 5000000,
            'actif' => true,
        ]);

        // Clients (colonnes: nom, email, telephone, adresse, ville, rccm, nif, solde)
        Client::create([
            'nom' => 'TOTAL Gabon',
            'email' => 'contact@total-gabon.com',
            'telephone' => '+241 01 79 20 00',
            'adresse' => 'Port-Gentil, Gabon',
            'ville' => 'Port-Gentil',
            'nif' => 'NIF123456789',
            'rccm' => 'GA-LBV-01-2020-A12345',
            'solde' => 0,
        ]);

        Client::create([
            'nom' => 'Ciments du Gabon',
            'email' => 'contact@cimgabon.com',
            'telephone' => '+241 01 70 30 30',
            'adresse' => 'Zone Industrielle, Owendo',
            'ville' => 'Libreville',
            'nif' => 'NIF987654321',
            'rccm' => 'GA-LBV-01-2019-B54321',
            'solde' => 0,
        ]);

        Client::create([
            'nom' => 'SETRAG',
            'email' => 'contact@setrag.ga',
            'telephone' => '+241 01 70 05 05',
            'adresse' => 'Gare ferroviaire, Owendo',
            'ville' => 'Libreville',
            'nif' => 'NIF456789123',
            'solde' => 0,
        ]);

        Client::create([
            'nom' => 'Société Gabonaise de Transport',
            'email' => 'info@sgt-gabon.com',
            'telephone' => '+241 01 44 55 66',
            'adresse' => 'Boulevard Triomphal, Libreville',
            'ville' => 'Libreville',
            'solde' => 0,
        ]);

        Client::create([
            'nom' => 'Jean-Pierre Moussavou',
            'email' => 'jp.moussavou@email.com',
            'telephone' => '+241 06 12 34 56',
            'adresse' => 'Quartier Glass, Libreville',
            'ville' => 'Libreville',
            'solde' => 0,
        ]);

        // Transitaires (colonnes: nom, email, telephone, adresse, actif)
        Transitaire::create([
            'nom' => 'Transit Express Gabon',
            'email' => 'contact@transitexpress.ga',
            'telephone' => '+241 01 44 11 22',
            'adresse' => 'Port d\'Owendo, Libreville',
            'actif' => true,
        ]);

        Transitaire::create([
            'nom' => 'Africa Transit SARL',
            'email' => 'info@africatransit.com',
            'telephone' => '+241 01 44 33 44',
            'adresse' => 'Zone Portuaire, Owendo',
            'actif' => true,
        ]);

        Transitaire::create([
            'nom' => 'Global Freight Gabon',
            'email' => 'contact@globalfreight.ga',
            'telephone' => '+241 01 44 55 66',
            'adresse' => 'Aéroport Léon Mba, Libreville',
            'actif' => true,
        ]);

        // Représentants (colonnes: nom, email, telephone, adresse, actif)
        Representant::create([
            'nom' => 'Représentations Maritimes du Gabon',
            'email' => 'contact@rmg.ga',
            'telephone' => '+241 01 55 11 22',
            'adresse' => 'Port d\'Owendo',
            'actif' => true,
        ]);

        Representant::create([
            'nom' => 'Coastal Shipping Services',
            'email' => 'info@coastal.ga',
            'telephone' => '+241 01 55 33 44',
            'adresse' => 'Boulevard Maritime, Libreville',
            'actif' => true,
        ]);

        // Armateurs (colonnes: nom, email, telephone, adresse, actif)
        Armateur::create([
            'nom' => 'Maersk Line',
            'email' => 'gabon@maersk.com',
            'telephone' => '+241 01 66 11 22',
            'adresse' => 'Port d\'Owendo, Libreville',
            'actif' => true,
        ]);

        Armateur::create([
            'nom' => 'MSC - Mediterranean Shipping Company',
            'email' => 'gabon@msc.com',
            'telephone' => '+241 01 66 33 44',
            'adresse' => 'Zone Portuaire, Owendo',
            'actif' => true,
        ]);

        Armateur::create([
            'nom' => 'CMA CGM',
            'email' => 'libreville@cma-cgm.com',
            'telephone' => '+241 01 66 55 66',
            'adresse' => 'Port d\'Owendo',
            'actif' => true,
        ]);

        Armateur::create([
            'nom' => 'Grimaldi Lines',
            'email' => 'gabon@grimaldi.com',
            'telephone' => '+241 01 66 77 88',
            'adresse' => 'Terminal Roulier, Owendo',
            'actif' => true,
        ]);
    }
}
