<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@logistiga.com'],
            [
                'nom' => 'Administrateur',
                'password' => Hash::make('Admin@123'),
                'telephone' => '+241 00 00 00 00',
                'actif' => true,
                'email_verified_at' => now(),
            ]
        );
        if (!$admin->hasRole('administrateur')) {
            $admin->assignRole('administrateur');
        }

        // Admin Omar
        $omar = User::firstOrCreate(
            ['email' => 'omar@logistiga.com'],
            [
                'nom' => 'Omar Amraoui',
                'password' => Hash::make('Amraoui@1'),
                'telephone' => '+241 00 00 00 01',
                'actif' => true,
                'email_verified_at' => now(),
            ]
        );
        if (!$omar->hasRole('administrateur')) {
            $omar->assignRole('administrateur');
        }
    }
}
