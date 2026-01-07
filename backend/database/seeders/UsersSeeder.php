<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // Directeur
        $directeur = User::create([
            'nom' => 'Jean Directeur',
            'email' => 'directeur@logistiga.com',
            'password' => Hash::make('Directeur@123'),
            'telephone' => '+241 01 11 11 11',
            'actif' => true,
            'email_verified_at' => now(),
        ]);
        $directeur->assignRole('directeur');

        // Commercial 1
        $commercial1 = User::create([
            'nom' => 'Marie Commercial',
            'email' => 'commercial@logistiga.com',
            'password' => Hash::make('Commercial@123'),
            'telephone' => '+241 01 22 22 22',
            'actif' => true,
            'email_verified_at' => now(),
        ]);
        $commercial1->assignRole('commercial');

        // Commercial 2
        $commercial2 = User::create([
            'nom' => 'Pierre Ventes',
            'email' => 'ventes@logistiga.com',
            'password' => Hash::make('Ventes@123'),
            'telephone' => '+241 01 22 22 23',
            'actif' => true,
            'email_verified_at' => now(),
        ]);
        $commercial2->assignRole('commercial');

        // Comptable
        $comptable = User::create([
            'nom' => 'Sophie Comptable',
            'email' => 'comptable@logistiga.com',
            'password' => Hash::make('Comptable@123'),
            'telephone' => '+241 01 33 33 33',
            'actif' => true,
            'email_verified_at' => now(),
        ]);
        $comptable->assignRole('comptable');

        // Caissier
        $caissier = User::create([
            'nom' => 'Paul Caissier',
            'email' => 'caissier@logistiga.com',
            'password' => Hash::make('Caissier@123'),
            'telephone' => '+241 01 44 44 44',
            'actif' => true,
            'email_verified_at' => now(),
        ]);
        $caissier->assignRole('caissier');

        // Opérateur
        $operateur = User::create([
            'nom' => 'Luc Opérateur',
            'email' => 'operateur@logistiga.com',
            'password' => Hash::make('Operateur@123'),
            'telephone' => '+241 01 55 55 55',
            'actif' => true,
            'email_verified_at' => now(),
        ]);
        $operateur->assignRole('operateur');
    }
}
