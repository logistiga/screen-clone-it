<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        foreach (['lignes_ordres', 'lignes_devis', 'lignes_factures'] as $tableName) {
            if (!Schema::hasTable($tableName)) continue;

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'point_depart')) {
                    $table->string('point_depart', 100)->nullable()->after('lieu_arrivee');
                }
                if (!Schema::hasColumn($tableName, 'point_arrivee')) {
                    $table->string('point_arrivee', 100)->nullable()->after('point_depart');
                }
                if (!Schema::hasColumn($tableName, 'type_transport')) {
                    $table->string('type_transport', 30)->nullable()->after('point_arrivee');
                }
                if (!Schema::hasColumn($tableName, 'mode_trajet')) {
                    $table->string('mode_trajet', 20)->nullable()->after('type_transport');
                }
                if (!Schema::hasColumn($tableName, 'materiel')) {
                    $table->string('materiel', 150)->nullable()->after('mode_trajet');
                }
                if (!Schema::hasColumn($tableName, 'nombre_jours')) {
                    $table->unsignedInteger('nombre_jours')->nullable()->after('materiel');
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['lignes_ordres', 'lignes_devis', 'lignes_factures'] as $tableName) {
            if (!Schema::hasTable($tableName)) continue;
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                foreach (['nombre_jours', 'materiel', 'mode_trajet', 'type_transport', 'point_arrivee', 'point_depart'] as $col) {
                    if (Schema::hasColumn($tableName, $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
