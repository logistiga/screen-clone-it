<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories_depenses', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->unique();
            $table->string('description')->nullable();
            $table->string('type')->default('Sortie'); // Entrée ou Sortie
            $table->string('couleur')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Ajouter la référence dans mouvements_caisse
        Schema::table('mouvements_caisse', function (Blueprint $table) {
            $table->foreignId('categorie_depense_id')->nullable()->after('categorie')->constrained('categories_depenses')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('mouvements_caisse', function (Blueprint $table) {
            $table->dropForeign(['categorie_depense_id']);
            $table->dropColumn('categorie_depense_id');
        });

        Schema::dropIfExists('categories_depenses');
    }
};
