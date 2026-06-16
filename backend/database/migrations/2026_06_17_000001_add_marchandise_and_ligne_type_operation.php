<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ajouter type_marchandise, description_generale, observation_interne sur les 3 docs
        foreach (['ordres_travail', 'devis', 'factures'] as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'type_marchandise')) {
                    // ENUM applicatif : conteneur, materiel, marchandise_generale, engin, autre
                    $table->string('type_marchandise', 40)->nullable()->after('type_operation_indep');
                }
                if (!Schema::hasColumn($tableName, 'description_generale')) {
                    $table->text('description_generale')->nullable()->after('type_marchandise');
                }
                if (!Schema::hasColumn($tableName, 'observation_interne')) {
                    $table->text('observation_interne')->nullable()->after('description_generale');
                }
            });
        }

        // 2. Ajouter type_operation sur les lignes (par-ligne au lieu de global)
        foreach (['lignes_ordres', 'lignes_devis', 'lignes_factures'] as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }
            if (!Schema::hasColumn($tableName, 'type_operation')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->string('type_operation', 40)->nullable()->after('description');
                });
            }
        }

        // 3. Backfill : copier type_operation_indep du parent dans les lignes existantes
        try {
            DB::statement("
                UPDATE lignes_ordres lo
                INNER JOIN ordres_travail o ON o.id = lo.ordre_id
                SET lo.type_operation = COALESCE(NULLIF(lo.type_operation, ''), o.type_operation_indep, o.type_operation)
                WHERE (lo.type_operation IS NULL OR lo.type_operation = '')
            ");
        } catch (\Throwable $e) {
            // ignore si environnement vide
        }
        try {
            DB::statement("
                UPDATE lignes_devis ld
                INNER JOIN devis d ON d.id = ld.devis_id
                SET ld.type_operation = COALESCE(NULLIF(ld.type_operation, ''), d.type_operation_indep, d.type_operation)
                WHERE (ld.type_operation IS NULL OR ld.type_operation = '')
            ");
        } catch (\Throwable $e) {
        }
        try {
            DB::statement("
                UPDATE lignes_factures lf
                INNER JOIN factures f ON f.id = lf.facture_id
                SET lf.type_operation = COALESCE(NULLIF(lf.type_operation, ''), f.type_operation_indep, f.type_operation)
                WHERE (lf.type_operation IS NULL OR lf.type_operation = '')
            ");
        } catch (\Throwable $e) {
        }
    }

    public function down(): void
    {
        foreach (['ordres_travail', 'devis', 'factures'] as $tableName) {
            if (!Schema::hasTable($tableName)) continue;
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                foreach (['observation_interne', 'description_generale', 'type_marchandise'] as $col) {
                    if (Schema::hasColumn($tableName, $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
        foreach (['lignes_ordres', 'lignes_devis', 'lignes_factures'] as $tableName) {
            if (!Schema::hasTable($tableName)) continue;
            if (Schema::hasColumn($tableName, 'type_operation')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('type_operation');
                });
            }
        }
    }
};
