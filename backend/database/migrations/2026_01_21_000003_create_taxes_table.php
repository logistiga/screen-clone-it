<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // TVA, CSS, etc.
            $table->string('nom', 100); // Taxe sur la Valeur Ajoutée
            $table->decimal('taux', 5, 2)->default(0); // 18.00, 1.00
            $table->text('description')->nullable();
            $table->boolean('obligatoire')->default(true);
            $table->boolean('active')->default(true);
            $table->integer('ordre')->default(0); // Ordre d'affichage
            $table->timestamps();
        });

        // Insérer les taxes par défaut
        DB::table('taxes')->insert([
            [
                'code' => 'TVA',
                'nom' => 'Taxe sur la Valeur Ajoutée',
                'taux' => 18.00,
                'description' => 'Taxe applicable sur toutes les prestations de services',
                'obligatoire' => true,
                'active' => true,
                'ordre' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'CSS',
                'nom' => 'Contribution Spéciale de Solidarité',
                'taux' => 1.00,
                'description' => 'Contribution au titre de la solidarité nationale',
                'obligatoire' => true,
                'active' => true,
                'ordre' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};
