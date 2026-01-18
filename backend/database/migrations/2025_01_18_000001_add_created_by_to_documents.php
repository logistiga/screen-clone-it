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
        // Ajouter created_by aux ordres de travail
        Schema::table('ordres_travail', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('notes')->constrained('users')->nullOnDelete();
        });

        // Ajouter created_by aux devis
        Schema::table('devis', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('notes')->constrained('users')->nullOnDelete();
        });

        // Ajouter created_by aux factures
        Schema::table('factures', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('notes')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ordres_travail', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });

        Schema::table('devis', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });

        Schema::table('factures', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });
    }
};
