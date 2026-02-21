<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Si l'ancienne colonne JSON existe, la supprimer
        if (Schema::hasColumn('armateurs', 'types_conteneurs')) {
            Schema::table('armateurs', function (Blueprint $table) {
                $table->dropColumn('types_conteneurs');
            });
        }

        // Ajouter la bonne colonne string si elle n'existe pas
        if (!Schema::hasColumn('armateurs', 'type_conteneur')) {
            Schema::table('armateurs', function (Blueprint $table) {
                $table->string('type_conteneur', 50)->nullable()->after('code');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('armateurs', 'type_conteneur')) {
            Schema::table('armateurs', function (Blueprint $table) {
                $table->dropColumn('type_conteneur');
            });
        }

        if (!Schema::hasColumn('armateurs', 'types_conteneurs')) {
            Schema::table('armateurs', function (Blueprint $table) {
                $table->json('types_conteneurs')->nullable()->after('code');
            });
        }
    }
};
