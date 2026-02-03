<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table pour stocker les anomalies détectées entre OPS et FAC
     * - oublie: conteneur présent dans OPS mais absent d'un OT existant pour même client+BL
     * - doublon: même conteneur dans plusieurs OT
     * - mismatch: incohérence de données entre OPS et FAC
     */
    public function up(): void
    {
        Schema::create('conteneurs_anomalies', function (Blueprint $table) {
            $table->id();
            
            // Type d'anomalie
            $table->enum('type', ['oublie', 'doublon', 'mismatch'])->default('oublie');
            
            // Informations du conteneur concerné
            $table->string('numero_conteneur', 20);
            $table->string('numero_bl', 100)->nullable();
            $table->string('client_nom')->nullable();
            
            // Lien vers l'OT existant (pour les anomalies "oublie")
            $table->foreignId('ordre_travail_id')->nullable()->constrained('ordres_travail')->nullOnDelete();
            
            // Détails en JSON (conteneurs OPS, conteneurs OT, manquants, etc.)
            $table->json('details')->nullable();
            
            // Statut de traitement
            $table->enum('statut', ['non_traite', 'traite', 'ignore'])->default('non_traite');
            
            // Traitement
            $table->foreignId('traite_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('traite_at')->nullable();
            
            // Métadonnées
            $table->timestamp('detected_at')->nullable();
            $table->timestamps();
            
            // Index pour la recherche et le filtrage
            $table->index('type');
            $table->index('statut');
            $table->index('numero_conteneur');
            $table->index('numero_bl');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conteneurs_anomalies');
    }
};
