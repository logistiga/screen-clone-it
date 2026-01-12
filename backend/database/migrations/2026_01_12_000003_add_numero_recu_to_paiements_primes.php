<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('paiements_primes')) {
            return;
        }

        if (!Schema::hasColumn('paiements_primes', 'numero_recu')) {
            Schema::table('paiements_primes', function (Blueprint $table) {
                $table->string('numero_recu', 50)->nullable()->unique()->after('id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('paiements_primes') && Schema::hasColumn('paiements_primes', 'numero_recu')) {
            Schema::table('paiements_primes', function (Blueprint $table) {
                $table->dropColumn('numero_recu');
            });
        }
    }
};
