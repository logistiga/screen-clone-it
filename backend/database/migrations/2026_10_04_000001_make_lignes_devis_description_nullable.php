<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Corrige SQLSTATE 1364 : une ligne de devis sans description doit pouvoir être enregistrée.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lignes_devis') && Schema::hasColumn('lignes_devis', 'description')) {
            DB::statement('ALTER TABLE lignes_devis MODIFY description TEXT NULL');
        }
    }

    public function down(): void
    {
        // Pas de retour en NOT NULL : risquerait de casser les lignes déjà enregistrées sans description.
    }
};
