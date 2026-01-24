<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table pour stocker les conteneurs traités reçus depuis Logistiga OPS
     * Ces conteneurs sont en attente de facturation
     */
    public function up(): void
    {
        Schema::create('conteneurs_traites', function (Blueprint $table) {
            $table->id();
            
            // Référence externe (ID de la sortie dans OPS)
            $table->string('sortie_id_externe')->nullable();
            
            // Informations conteneur
            $table->string('numero_conteneur', 20);
            $table->string('numero_bl', 100)->nullable();
            
            // Armateur
            $table->string('armateur_code', 20)->nullable();
            $table->string('armateur_nom')->nullable();
            
            // Client
            $table->string('client_nom')->nullable();
            $table->text('client_adresse')->nullable();
            
            // Transitaire
            $table->string('transitaire_nom')->nullable();
            
            // Dates opérationnelles
            $table->date('date_sortie')->nullable();
            $table->date('date_retour')->nullable();
            
            // Véhicule
            $table->unsignedBigInteger('camion_id_externe')->nullable();
            $table->string('camion_plaque', 50)->nullable();
            $table->unsignedBigInteger('remorque_id_externe')->nullable();
            $table->string('remorque_plaque', 50)->nullable();
            
            // Chauffeur
            $table->string('chauffeur_nom')->nullable();
            $table->decimal('prime_chauffeur', 12, 2)->nullable();
            
            // Destination
            $table->string('destination_type', 50)->nullable();
            $table->text('destination_adresse')->nullable();
            
            // Statut du conteneur dans OPS
            $table->string('statut_ops', 50)->nullable();
            
            // Statut de traitement côté facturation
            $table->enum('statut', ['en_attente', 'affecte', 'facture', 'ignore'])->default('en_attente');
            
            // Lien vers l'ordre de travail après affectation
            $table->foreignId('ordre_travail_id')->nullable()->constrained('ordres_travail')->nullOnDelete();
            
            // Métadonnées de synchronisation
            $table->string('source_system', 50)->default('logistiga_ops');
            $table->timestamp('synced_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            
            // Index pour la recherche et le filtrage
            $table->index('numero_conteneur');
            $table->index('numero_bl');
            $table->index('statut');
            $table->index('date_sortie');
            $table->unique('sortie_id_externe');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conteneurs_traites');
    }
};
