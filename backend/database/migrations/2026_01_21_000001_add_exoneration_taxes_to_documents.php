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
        // Ajouter les colonnes d'exonération à la table factures
        Schema::table('factures', function (Blueprint $table) {
            if (!Schema::hasColumn('factures', 'exonere_tva')) {
                $table->boolean('exonere_tva')->default(false)->after('css');
            }
            if (!Schema::hasColumn('factures', 'exonere_css')) {
                $table->boolean('exonere_css')->default(false)->after('exonere_tva');
            }
            if (!Schema::hasColumn('factures', 'motif_exoneration')) {
                $table->string('motif_exoneration', 255)->nullable()->after('exonere_css');
            }
        });

        // Ajouter les colonnes d'exonération à la table ordres_travail
        Schema::table('ordres_travail', function (Blueprint $table) {
            if (!Schema::hasColumn('ordres_travail', 'exonere_tva')) {
                $table->boolean('exonere_tva')->default(false)->after('css');
            }
            if (!Schema::hasColumn('ordres_travail', 'exonere_css')) {
                $table->boolean('exonere_css')->default(false)->after('exonere_tva');
            }
            if (!Schema::hasColumn('ordres_travail', 'motif_exoneration')) {
                $table->string('motif_exoneration', 255)->nullable()->after('exonere_css');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->dropColumn(['exonere_tva', 'exonere_css', 'motif_exoneration']);
        });

        Schema::table('ordres_travail', function (Blueprint $table) {
            $table->dropColumn(['exonere_tva', 'exonere_css', 'motif_exoneration']);
        });
    }
};
