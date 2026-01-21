<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('taxes_mensuelles', function (Blueprint $table) {
            $table->id();
            $table->integer('annee');
            $table->integer('mois'); // 1-12
            $table->string('type_taxe', 10); // 'TVA' ou 'CSS'
            $table->decimal('taux_applique', 5, 2); // Taux au moment de l'agrégation
            $table->decimal('montant_ht_total', 15, 2)->default(0); // Base HT taxable
            $table->decimal('montant_taxe_total', 15, 2)->default(0); // Total taxe collectée
            $table->decimal('montant_exonere', 15, 2)->default(0); // Montant exonéré
            $table->integer('nombre_documents')->default(0); // Nombre de docs
            $table->integer('nombre_exonerations')->default(0); // Docs exonérés
            $table->boolean('cloture')->default(false); // Mois clôturé
            $table->timestamp('cloture_at')->nullable();
            $table->timestamps();

            // Index pour performance
            $table->unique(['annee', 'mois', 'type_taxe'], 'unique_periode_taxe');
            $table->index(['annee', 'type_taxe'], 'idx_annee_taxe');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxes_mensuelles');
    }
};
