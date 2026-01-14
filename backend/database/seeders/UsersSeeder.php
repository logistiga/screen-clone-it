<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'nom' => 'Jean Directeur',
                'email' => 'directeur@logistiga.com',
                'password' => Hash::make('Directeur@123'),
                'telephone' => '+241 01 11 11 11',
                'role' => 'directeur',
            ],
            [
                'nom' => 'Marie Commercial',
                'email' => 'commercial@logistiga.com',
                'password' => Hash::make('Commercial@123'),
                'telephone' => '+241 01 22 22 22',
                'role' => 'commercial',
            ],
            [
                'nom' => 'Pierre Ventes',
                'email' => 'ventes@logistiga.com',
                'password' => Hash::make('Ventes@123'),
                'telephone' => '+241 01 22 22 23',
                'role' => 'commercial',
            ],
            [
                'nom' => 'Sophie Comptable',
                'email' => 'comptable@logistiga.com',
                'password' => Hash::make('Comptable@123'),
                'telephone' => '+241 01 33 33 33',
                'role' => 'comptable',
            ],
            [
                'nom' => 'Paul Caissier',
                'email' => 'caissier@logistiga.com',
                'password' => Hash::make('Caissier@123'),
                'telephone' => '+241 01 44 44 44',
                'role' => 'caissier',
            ],
            [
                'nom' => 'Luc Opérateur',
                'email' => 'operateur@logistiga.com',
                'password' => Hash::make('Operateur@123'),
                'telephone' => '+241 01 55 55 55',
                'role' => 'operateur',
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'actif' => true,
                    'email_verified_at' => now(),
                ])
            );

            if (!$user->hasRole($role)) {
                $user->assignRole($role);
            }
        }
    }
}
