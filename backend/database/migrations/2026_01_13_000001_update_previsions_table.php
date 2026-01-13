<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('previsions');
        
        Schema::create('previsions', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['recette', 'depense'])->default('recette');
            $table->enum('source', ['caisse', 'banque'])->default('caisse');
            $table->string('categorie');
            $table->string('description')->nullable();
            $table->decimal('montant_prevu', 15, 2)->default(0);
            $table->decimal('montant_realise', 15, 2)->default(0);
            $table->integer('mois'); // 1-12
            $table->integer('annee');
            $table->date('date_prevue')->nullable();
            $table->enum('statut', ['en_cours', 'atteint', 'depasse', 'non_atteint'])->default('en_cours');
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('banque_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['type', 'source', 'categorie', 'mois', 'annee'], 'prevision_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('previsions');
    }
};
