<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter type_conteneur à conteneurs_traites
        Schema::table('conteneurs_traites', function (Blueprint $table) {
            $table->string('type_conteneur', 50)->nullable()->after('numero_bl');
        });

        // Ajouter type_conteneur (string) à armateurs
        Schema::table('armateurs', function (Blueprint $table) {
            $table->string('type_conteneur', 50)->nullable()->after('code');
        });
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
