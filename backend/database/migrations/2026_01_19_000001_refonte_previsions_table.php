<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Supprimer l'ancienne table et recréer avec nouvelle structure
        Schema::dropIfExists('previsions');
        
        Schema::create('previsions', function (Blueprint $table) {
            $table->id();
            
            // Type: recette ou dépense
            $table->enum('type', ['recette', 'depense'])->default('depense');
            
            // Catégorie (ex: Salaires, Carburant, Facturation clients, etc.)
            $table->string('categorie');
            $table->string('description')->nullable();
            
            // Budget prévu pour le mois
            $table->decimal('montant_prevu', 15, 2)->default(0);
            
            // Montant réalisé - combinaison caisse + banque
            $table->decimal('realise_caisse', 15, 2)->default(0);
            $table->decimal('realise_banque', 15, 2)->default(0);
            
            // Période
            $table->integer('mois'); // 1-12
            $table->integer('annee');
            
            // Statut calculé automatiquement
            $table->enum('statut', ['en_cours', 'atteint', 'depasse', 'non_atteint'])->default('en_cours');
            
            // Notes et métadonnées
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            // Une seule prévision par catégorie/type/mois/année
            $table->unique(['type', 'categorie', 'mois', 'annee'], 'prevision_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('previsions');
    }
};
