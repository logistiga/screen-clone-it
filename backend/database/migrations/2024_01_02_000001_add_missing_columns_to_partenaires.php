<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter les colonnes manquantes à armateurs
        Schema::table('armateurs', function (Blueprint $table) {
            $table->string('code')->nullable()->unique()->after('nom');
        });

        // Ajouter les colonnes manquantes à transitaires
        Schema::table('transitaires', function (Blueprint $table) {
            $table->string('contact_principal')->nullable()->after('adresse');
            $table->string('nif')->nullable()->after('contact_principal');
            $table->string('rccm')->nullable()->after('nif');
        });

        // Ajouter les colonnes manquantes à representants
        Schema::table('representants', function (Blueprint $table) {
            $table->string('prenom')->nullable()->after('nom');
            $table->string('zone')->nullable()->after('adresse');
            $table->decimal('taux_commission', 5, 2)->nullable()->after('zone');
        });
    }

    public function down(): void
    {
        Schema::table('armateurs', function (Blueprint $table) {
            $table->dropColumn('code');
        });

        Schema::table('transitaires', function (Blueprint $table) {
            $table->dropColumn(['contact_principal', 'nif', 'rccm']);
        });

        Schema::table('representants', function (Blueprint $table) {
            $table->dropColumn(['prenom', 'zone', 'taux_commission']);
        });
    }
};
