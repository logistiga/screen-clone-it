<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ajouter date_envoi sur devis
        if (Schema::hasTable('devis') && !Schema::hasColumn('devis', 'date_envoi')) {
            Schema::table('devis', function (Blueprint $table) {
                $table->timestamp('date_envoi')->nullable()->after('statut');
            });
        }

        // Ajouter date_envoi sur factures
        if (Schema::hasTable('factures') && !Schema::hasColumn('factures', 'date_envoi')) {
            Schema::table('factures', function (Blueprint $table) {
                $table->timestamp('date_envoi')->nullable()->after('statut');
            });
        }

        // Ajouter date_envoi sur ordres_travail (pour cohérence)
        if (Schema::hasTable('ordres_travail') && !Schema::hasColumn('ordres_travail', 'date_envoi')) {
            Schema::table('ordres_travail', function (Blueprint $table) {
                $table->timestamp('date_envoi')->nullable()->after('statut');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('devis', 'date_envoi')) {
            Schema::table('devis', function (Blueprint $table) {
                $table->dropColumn('date_envoi');
            });
        }

        if (Schema::hasColumn('factures', 'date_envoi')) {
            Schema::table('factures', function (Blueprint $table) {
                $table->dropColumn('date_envoi');
            });
        }

        if (Schema::hasColumn('ordres_travail', 'date_envoi')) {
            Schema::table('ordres_travail', function (Blueprint $table) {
                $table->dropColumn('date_envoi');
            });
        }
    }
};
