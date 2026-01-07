<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'nom' => 'Administrateur',
            'email' => 'admin@logistiga.com',
            'password' => Hash::make('Admin@123'),
            'telephone' => '+241 00 00 00 00',
            'actif' => true,
            'email_verified_at' => now(),
        ]);

        $admin->assignRole('administrateur');
    }
}
