<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Sécurisation: certains environnements anciens peuvent ne pas avoir la colonne montant_ttc
        // malgré le modèle/code qui l'utilise.
        if (!Schema::hasTable('ordres_travail')) {
            return;
        }

        if (!Schema::hasColumn('ordres_travail', 'montant_ttc')) {
            Schema::table('ordres_travail', function (Blueprint $table) {
                $table->decimal('montant_ttc', 15, 2)->default(0)->after('css');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('ordres_travail')) {
            return;
        }

        if (Schema::hasColumn('ordres_travail', 'montant_ttc')) {
            Schema::table('ordres_travail', function (Blueprint $table) {
                $table->dropColumn('montant_ttc');
            });
        }
    }
};
