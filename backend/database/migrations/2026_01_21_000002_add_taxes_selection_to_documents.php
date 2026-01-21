<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Ajoute une colonne JSON pour stocker la sélection des taxes de manière dynamique :
     * {
     *   "selected_tax_codes": ["TVA", "CSS"],
     *   "has_exoneration": true,
     *   "exonerated_tax_codes": ["TVA"],
     *   "motif_exoneration": "Attestation zone franche"
     * }
     */
    public function up(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            if (!Schema::hasColumn('factures', 'taxes_selection')) {
                $table->json('taxes_selection')->nullable()->after('motif_exoneration');
            }
        });

        Schema::table('ordres_travail', function (Blueprint $table) {
            if (!Schema::hasColumn('ordres_travail', 'taxes_selection')) {
                $table->json('taxes_selection')->nullable()->after('motif_exoneration');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            if (Schema::hasColumn('factures', 'taxes_selection')) {
                $table->dropColumn('taxes_selection');
            }
        });

        Schema::table('ordres_travail', function (Blueprint $table) {
            if (Schema::hasColumn('ordres_travail', 'taxes_selection')) {
                $table->dropColumn('taxes_selection');
            }
        });
    }
};
