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

        // Transitaires importés depuis la base legacy (~125 transitaires)
        $transitaires = [
            ['nom' => 'SEPT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'PIN SHANG - COULIBALY', 'telephone' => '+241 07870524', 'email' => '', 'adresse' => ''],
            ['nom' => 'AUTC', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'TRANSIT 2000', 'telephone' => '', 'email' => 'transit2000@logistiga.com', 'adresse' => ''],
            ['nom' => 'AUTC - MAMADI', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'NV TRANSIT - MOHAMED', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'BOCOUM', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'SDV', 'telephone' => '', 'email' => 'SDV@LOGISTIGA.COM', 'adresse' => ''],
            ['nom' => 'COULIBALY', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'SYLLA', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'ICHAM', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'DHL', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MALICK', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'CHAOUKI', 'telephone' => '+241 65303809', 'email' => 'chaoukimas30@gmail.com', 'adresse' => ''],
            ['nom' => 'TMT', 'telephone' => '+241 11707363', 'email' => 'contact@tmtransit.com', 'adresse' => ''],
            ['nom' => 'T.M.A.C', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'AITC', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'JUNIOR', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'AMIDOU', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'CATRAMAC', 'telephone' => '+241 06130554', 'email' => '', 'adresse' => ''],
            ['nom' => 'SGT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'BM TRANSITE', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'ETL', 'telephone' => '+241 06614100', 'email' => 'commercial.etl241@gmail.com', 'adresse' => ''],
            ['nom' => 'MR MARTIN', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'OGTT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'BOLLORE', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'GETRACO', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'TRIANON BTP', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'DELTA TRANSIT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'GEORGE', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'SGTA', 'telephone' => '+241 07501242', 'email' => '', 'adresse' => ''],
            ['nom' => 'UCO', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'STSG', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'NDIAYE', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'KABA BANGALY', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'STARPLY GABON', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'LUIGY', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'TRALOG', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'FRET TAM', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'STT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'ASG', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'SGTM', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'FABUS', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'SAMY', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'JULE NZE', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'STS', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'CAP TRANSIT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'SERVICE TRANSIT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'FOFANA', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'TATA SHIPING', 'telephone' => '+241 77384071', 'email' => 'nomokongoma@yahoo.fr', 'adresse' => ''],
            ['nom' => 'SOMATRANS', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MAERSK', 'telephone' => '', 'email' => 'ga.import@maersk.com', 'adresse' => ''],
            ['nom' => 'MEDLOG', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'GLOBAL TRANSIT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MILENIUM SERVICE PLUS', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MBA', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'TRANSTAR', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'M.T.L.', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'WALID', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'ITRAMA', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'SOGAT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'SALAM', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => '2RC-INTER', 'telephone' => '+241 07276465', 'email' => '', 'adresse' => ''],
            ['nom' => 'STGS', 'telephone' => '+241 06589144', 'email' => '', 'adresse' => ''],
            ['nom' => 'TCH', 'telephone' => '+241 07892660', 'email' => '', 'adresse' => ''],
            ['nom' => 'MTL GABON', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MCTT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'SO.GA.TT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'BTPS', 'telephone' => '+241 77651570', 'email' => '', 'adresse' => ''],
            ['nom' => 'CEM - MOUSTAPHA', 'telephone' => '+241 05999781', 'email' => '', 'adresse' => ''],
            ['nom' => 'T.A.G', 'telephone' => '+241 77819690', 'email' => '', 'adresse' => ''],
            ['nom' => 'A.D.C', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'GSEZ', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'CETAN', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'LOUIGHY', 'telephone' => '+241 66087311', 'email' => '', 'adresse' => ''],
            ['nom' => 'UNIVERSEL TRANSIT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'TNS', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'LSG', 'telephone' => '+241 11705726', 'email' => 'junior.yenda@lsg-gabon.com', 'adresse' => 'Owendo'],
            ['nom' => 'NOUVELLE VISION TRANSIT', 'telephone' => '', 'email' => '', 'adresse' => 'Owendo'],
            ['nom' => 'GPT', 'telephone' => '', 'email' => '', 'adresse' => 'Owendo'],
            ['nom' => 'ART', 'telephone' => '+241 65998151', 'email' => 'k.moutsiga@artgabon.com', 'adresse' => 'Owendo'],
            ['nom' => 'THIAM', 'telephone' => '', 'email' => '', 'adresse' => 'Owendo'],
            ['nom' => 'FRANCIS', 'telephone' => '+241 77317853', 'email' => '', 'adresse' => 'Owendo'],
            ['nom' => 'BUSINESS AIR LOGISTICS', 'telephone' => '+241 66198454', 'email' => '', 'adresse' => 'ACAE'],
            ['nom' => 'MULTI-SERVICE TRANSIT', 'telephone' => '', 'email' => '', 'adresse' => 'Oloumi'],
            ['nom' => 'MASAOUD', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'TMAC', 'telephone' => '', 'email' => '', 'adresse' => 'Libreville'],
            ['nom' => 'CTI', 'telephone' => '+241 62143402', 'email' => '', 'adresse' => 'Owendo'],
            ['nom' => 'FORMALIS', 'telephone' => '+241 77534576', 'email' => 'drameramamadou2018@gmail.com', 'adresse' => 'Libreville'],
            ['nom' => 'KANE', 'telephone' => '', 'email' => '', 'adresse' => 'Libreville'],
            ['nom' => 'BIC-TRANS', 'telephone' => '+241 62113504', 'email' => '', 'adresse' => ''],
            ['nom' => 'GTGA', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'KENNEDY', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'TRANSGAB', 'telephone' => '+241 77363618', 'email' => 'giggs504@yahoo.fr', 'adresse' => ''],
            ['nom' => 'INTER-TRANSIT GABON', 'telephone' => '+241 66004341', 'email' => 'intertransitgabon@gmail.com', 'adresse' => ''],
            ['nom' => 'RAPIDE TRANSIT FRET', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'CTAM', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'NAVI TRANS', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'B.A.T', 'telephone' => '+241 77244347', 'email' => '', 'adresse' => ''],
            ['nom' => 'APRETRAC', 'telephone' => '+241 66412221', 'email' => 'dissouchr@yahoo.fr', 'adresse' => ''],
            ['nom' => 'SACO', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'DOUKMAT', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MTN', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'ISSIAKA', 'telephone' => '+241 66011022', 'email' => '', 'adresse' => ''],
            ['nom' => 'DJANE', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'ADC', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'GAPS', 'telephone' => '+241 11706289', 'email' => '', 'adresse' => ''],
            ['nom' => 'DIAKITE', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MR SIDY', 'telephone' => '+241 62794918', 'email' => '', 'adresse' => ''],
            ['nom' => 'MOHAMED DIAKITE', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'BAKAYOKO', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MR SALAM', 'telephone' => '+241 77870524', 'email' => '', 'adresse' => ''],
            ['nom' => 'SACKO DRAMANE', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MR DIABY', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MR PAUL HENRI', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MR MOUSSA', 'telephone' => '', 'email' => '', 'adresse' => ''],
            ['nom' => 'MR MAHAMOUDOU', 'telephone' => '+241 60321168', 'email' => '', 'adresse' => ''],
            ['nom' => 'MR DICKO', 'telephone' => '+241 60321168', 'email' => '', 'adresse' => ''],
            ['nom' => 'G.E.T', 'telephone' => '', 'email' => '', 'adresse' => ''],
        ];

        foreach ($transitaires as $data) {
            Transitaire::create([
                'nom' => $data['nom'],
                'email' => $data['email'] ?: null,
                'telephone' => $data['telephone'] ?: null,
                'adresse' => $data['adresse'] ?: null,
                'actif' => true,
            ]);
        }

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
