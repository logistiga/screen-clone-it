<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter les colonnes manquantes à mouvements_caisse
        Schema::table('mouvements_caisse', function (Blueprint $table) {
            $table->string('mode_paiement')->nullable()->after('categorie');
            $table->string('reference')->nullable()->after('mode_paiement');
            $table->foreignId('client_id')->nullable()->after('reference')->constrained()->nullOnDelete();
            $table->foreignId('annulation_id')->nullable()->after('client_id');
        });

        // Ajouter les colonnes de remboursement à annulations
        Schema::table('annulations', function (Blueprint $table) {
            $table->boolean('rembourse')->default(false)->after('numero_avoir');
            $table->decimal('montant_rembourse', 15, 2)->default(0)->after('rembourse');
            $table->date('date_remboursement')->nullable()->after('montant_rembourse');
            $table->decimal('solde_avoir', 15, 2)->default(0)->after('date_remboursement');
        });
    }

    public function down(): void
    {
        Schema::table('mouvements_caisse', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropColumn(['mode_paiement', 'reference', 'client_id', 'annulation_id']);
        });

        Schema::table('annulations', function (Blueprint $table) {
            $table->dropColumn(['rembourse', 'montant_rembourse', 'date_remboursement', 'solde_avoir']);
        });
    }
};
