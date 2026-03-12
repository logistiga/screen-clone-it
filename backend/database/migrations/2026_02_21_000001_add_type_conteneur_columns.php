<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('conteneurs_traites', 'type_conteneur')) {
            Schema::table('conteneurs_traites', function (Blueprint $table) {
                $table->string('type_conteneur', 50)->nullable()->after('numero_bl');
            });
        }

        if (!Schema::hasColumn('armateurs', 'type_conteneur')) {
            Schema::table('armateurs', function (Blueprint $table) {
                $table->string('type_conteneur', 50)->nullable()->after('code');
            });
        }
    }

    public function down(): void
    {
        Schema::table('conteneurs_traites', function (Blueprint $table) {
            $table->dropColumn('type_conteneur');
        });

        Schema::table('armateurs', function (Blueprint $table) {
            $table->dropColumn('type_conteneur');
        });
    }
};
