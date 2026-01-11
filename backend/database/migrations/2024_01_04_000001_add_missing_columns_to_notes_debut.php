<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes_debut', function (Blueprint $table) {
            // Ajouter les colonnes manquantes si elles n'existent pas
            if (!Schema::hasColumn('notes_debut', 'bl_numero')) {
                $table->string('bl_numero', 100)->nullable()->after('numero_bl');
            }
            if (!Schema::hasColumn('notes_debut', 'conteneur_type')) {
                $table->string('conteneur_type', 50)->nullable()->after('conteneur_numero');
            }
            if (!Schema::hasColumn('notes_debut', 'date_debut')) {
                $table->date('date_debut')->nullable()->after('date_arrivee');
            }
            if (!Schema::hasColumn('notes_debut', 'date_fin')) {
                $table->date('date_fin')->nullable()->after('date_debut');
            }
            if (!Schema::hasColumn('notes_debut', 'nombre_jours')) {
                $table->integer('nombre_jours')->nullable()->after('jours_stockage');
            }
            if (!Schema::hasColumn('notes_debut', 'montant_ht')) {
                $table->decimal('montant_ht', 15, 2)->nullable()->after('tarif_journalier');
            }
            if (!Schema::hasColumn('notes_debut', 'montant_tva')) {
                $table->decimal('montant_tva', 15, 2)->nullable()->after('montant_ht');
            }
            if (!Schema::hasColumn('notes_debut', 'montant_css')) {
                $table->decimal('montant_css', 15, 2)->nullable()->after('montant_tva');
            }
            if (!Schema::hasColumn('notes_debut', 'montant_ttc')) {
                $table->decimal('montant_ttc', 15, 2)->nullable()->after('montant_css');
            }
            if (!Schema::hasColumn('notes_debut', 'montant_paye')) {
                $table->decimal('montant_paye', 15, 2)->default(0)->after('montant_total');
            }
            if (!Schema::hasColumn('notes_debut', 'montant_avance')) {
                $table->decimal('montant_avance', 15, 2)->default(0)->after('montant_paye');
            }
            if (!Schema::hasColumn('notes_debut', 'taux_tva')) {
                $table->decimal('taux_tva', 5, 2)->nullable()->after('montant_avance');
            }
            if (!Schema::hasColumn('notes_debut', 'taux_css')) {
                $table->decimal('taux_css', 5, 2)->nullable()->after('taux_tva');
            }
            if (!Schema::hasColumn('notes_debut', 'description')) {
                $table->text('description')->nullable()->after('observations');
            }
            if (!Schema::hasColumn('notes_debut', 'notes')) {
                $table->text('notes')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('notes_debut', function (Blueprint $table) {
            $columns = [
                'bl_numero', 'conteneur_type', 'date_debut', 'date_fin',
                'nombre_jours', 'montant_ht', 'montant_tva', 'montant_css', 
                'montant_ttc', 'montant_paye', 'montant_avance', 
                'taux_tva', 'taux_css', 'description', 'notes'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('notes_debut', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
