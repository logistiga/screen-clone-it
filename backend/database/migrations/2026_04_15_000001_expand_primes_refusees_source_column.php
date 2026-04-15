<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `primes_refusees` MODIFY `source` VARCHAR(50) NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `primes_refusees` MODIFY `source` ENUM('OPS','CNV') NOT NULL");
    }
};
