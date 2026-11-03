<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Notes de débit « Divers » : désignation et justificatif propres à chaque frais
 * (pont-bascule, péage...). Colonnes nullables : aucune donnée existante modifiée.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lignes_notes_debut', function (Blueprint $table) {
            if (!Schema::hasColumn('lignes_notes_debut', 'designation')) {
                $table->string('designation', 255)->nullable()->after('bl_numero');
            }
            if (!Schema::hasColumn('lignes_notes_debut', 'reference_justificatif')) {
                $table->string('reference_justificatif', 100)->nullable()->after('designation');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lignes_notes_debut', function (Blueprint $table) {
            foreach (['reference_justificatif', 'designation'] as $col) {
                if (Schema::hasColumn('lignes_notes_debut', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
