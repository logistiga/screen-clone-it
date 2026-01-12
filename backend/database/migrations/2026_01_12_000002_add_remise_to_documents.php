<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter les colonnes de remise sur devis
        if (Schema::hasTable('devis') && !Schema::hasColumn('devis', 'remise_type')) {
            Schema::table('devis', function (Blueprint $table) {
                $table->string('remise_type')->nullable()->after('montant_ht')->comment('pourcentage ou montant');
                $table->decimal('remise_valeur', 15, 2)->default(0)->after('remise_type');
                $table->decimal('remise_montant', 15, 2)->default(0)->after('remise_valeur')->comment('Montant calculé de la remise');
            });
        }

        // Ajouter les colonnes de remise sur ordres_travail
        if (Schema::hasTable('ordres_travail') && !Schema::hasColumn('ordres_travail', 'remise_type')) {
            Schema::table('ordres_travail', function (Blueprint $table) {
                $table->string('remise_type')->nullable()->after('montant_ht')->comment('pourcentage ou montant');
                $table->decimal('remise_valeur', 15, 2)->default(0)->after('remise_type');
                $table->decimal('remise_montant', 15, 2)->default(0)->after('remise_valeur')->comment('Montant calculé de la remise');
            });
        }

        // Ajouter les colonnes de remise sur factures
        if (Schema::hasTable('factures') && !Schema::hasColumn('factures', 'remise_type')) {
            Schema::table('factures', function (Blueprint $table) {
                $table->string('remise_type')->nullable()->after('montant_ht')->comment('pourcentage ou montant');
                $table->decimal('remise_valeur', 15, 2)->default(0)->after('remise_type');
                $table->decimal('remise_montant', 15, 2)->default(0)->after('remise_valeur')->comment('Montant calculé de la remise');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('devis')) {
            Schema::table('devis', function (Blueprint $table) {
                $table->dropColumn(['remise_type', 'remise_valeur', 'remise_montant']);
            });
        }

        if (Schema::hasTable('ordres_travail')) {
            Schema::table('ordres_travail', function (Blueprint $table) {
                $table->dropColumn(['remise_type', 'remise_valeur', 'remise_montant']);
            });
        }

        if (Schema::hasTable('factures')) {
            Schema::table('factures', function (Blueprint $table) {
                $table->dropColumn(['remise_type', 'remise_valeur', 'remise_montant']);
            });
        }
    }
};
