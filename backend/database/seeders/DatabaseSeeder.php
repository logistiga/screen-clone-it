<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            AdminUserSeeder::class,
            UsersSeeder::class,
            ConfigurationSeeder::class,
            EmailTemplatesSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
