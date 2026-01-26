<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lignes_notes_debut', function (Blueprint $table) {
            $table->id();
            $table->foreignId('note_debut_id')->constrained('notes_debut')->onDelete('cascade');
            
            // Référence ordre de travail
            $table->foreignId('ordre_id')->nullable()->constrained('ordres_travail')->onDelete('set null');
            
            // Informations conteneur/lot
            $table->string('conteneur_numero', 50)->nullable();
            $table->string('bl_numero', 100)->nullable();
            
            // Période de detention/stockage
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->integer('nombre_jours')->default(0);
            
            // Tarification
            $table->decimal('tarif_journalier', 15, 2)->default(0);
            $table->decimal('montant_ht', 15, 2)->default(0);
            
            // Notes supplémentaires
            $table->text('observations')->nullable();
            
            $table->timestamps();
            
            // Index pour recherche rapide
            $table->index('conteneur_numero');
            $table->index('bl_numero');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lignes_notes_debut');
    }
};
