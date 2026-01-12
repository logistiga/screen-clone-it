<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('primes')) {
            return;
        }

        // 1) Rendre ordre_id nullable (le modèle Prime est utilisé aussi pour les factures)
        // MySQL: il faut souvent drop la FK avant de modifier la colonne.
        try {
            Schema::table('primes', function (Blueprint $table) {
                $table->dropForeign(['ordre_id']);
            });
        } catch (\Throwable $e) {
            // ignore
        }

        try {
            DB::statement('ALTER TABLE `primes` MODIFY `ordre_id` BIGINT UNSIGNED NULL');
        } catch (\Throwable $e) {
            // ignore
        }

        try {
            Schema::table('primes', function (Blueprint $table) {
                $table->foreign('ordre_id')->references('id')->on('ordres_travail')->nullOnDelete();
            });
        } catch (\Throwable $e) {
            // ignore
        }

        // 2) Ajouter facture_id (utilisé par FactureServiceFactory + PrimeController)
        if (!Schema::hasColumn('primes', 'facture_id')) {
            Schema::table('primes', function (Blueprint $table) {
                $table->foreignId('facture_id')
                    ->nullable()
                    ->after('ordre_id')
                    ->constrained('factures')
                    ->nullOnDelete();
            });
        }

        // 3) Ajouter description (utilisé par FactureServiceFactory)
        if (!Schema::hasColumn('primes', 'description')) {
            Schema::table('primes', function (Blueprint $table) {
                $table->string('description', 500)->nullable()->after('montant');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('primes')) {
            return;
        }

        // Rollback best-effort
        if (Schema::hasColumn('primes', 'facture_id')) {
            try {
                Schema::table('primes', function (Blueprint $table) {
                    $table->dropConstrainedForeignId('facture_id');
                });
            } catch (\Throwable $e) {
                // ignore
            }
        }

        if (Schema::hasColumn('primes', 'description')) {
            try {
                Schema::table('primes', function (Blueprint $table) {
                    $table->dropColumn('description');
                });
            } catch (\Throwable $e) {
                // ignore
            }
        }

        // Remettre ordre_id NOT NULL (best-effort)
        try {
            Schema::table('primes', function (Blueprint $table) {
                $table->dropForeign(['ordre_id']);
            });
        } catch (\Throwable $e) {
            // ignore
        }

        try {
            DB::statement('ALTER TABLE `primes` MODIFY `ordre_id` BIGINT UNSIGNED NOT NULL');
        } catch (\Throwable $e) {
            // ignore
        }

        try {
            Schema::table('primes', function (Blueprint $table) {
                $table->foreign('ordre_id')->references('id')->on('ordres_travail')->onDelete('cascade');
            });
        } catch (\Throwable $e) {
            // ignore
        }
    }
};
