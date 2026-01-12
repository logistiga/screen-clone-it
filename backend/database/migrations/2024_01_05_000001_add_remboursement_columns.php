<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter les colonnes manquantes à mouvements_caisse si elles n'existent pas
        if (!Schema::hasColumn('mouvements_caisse', 'mode_paiement')) {
            Schema::table('mouvements_caisse', function (Blueprint $table) {
                $table->string('mode_paiement')->nullable()->after('categorie');
            });
        }
        if (!Schema::hasColumn('mouvements_caisse', 'reference')) {
            Schema::table('mouvements_caisse', function (Blueprint $table) {
                $table->string('reference')->nullable()->after('mode_paiement');
            });
        }
        if (!Schema::hasColumn('mouvements_caisse', 'client_id')) {
            Schema::table('mouvements_caisse', function (Blueprint $table) {
                $table->unsignedBigInteger('client_id')->nullable()->after('reference');
            });
        }
        if (!Schema::hasColumn('mouvements_caisse', 'annulation_id')) {
            Schema::table('mouvements_caisse', function (Blueprint $table) {
                $table->unsignedBigInteger('annulation_id')->nullable()->after('client_id');
            });
        }

        // Ajouter les colonnes de remboursement à annulations si elles n'existent pas
        if (!Schema::hasColumn('annulations', 'rembourse')) {
            Schema::table('annulations', function (Blueprint $table) {
                $table->boolean('rembourse')->default(false)->after('numero_avoir');
            });
        }
        if (!Schema::hasColumn('annulations', 'montant_rembourse')) {
            Schema::table('annulations', function (Blueprint $table) {
                $table->decimal('montant_rembourse', 15, 2)->default(0)->after('rembourse');
            });
        }
        if (!Schema::hasColumn('annulations', 'date_remboursement')) {
            Schema::table('annulations', function (Blueprint $table) {
                $table->date('date_remboursement')->nullable()->after('montant_rembourse');
            });
        }
        if (!Schema::hasColumn('annulations', 'solde_avoir')) {
            Schema::table('annulations', function (Blueprint $table) {
                $table->decimal('solde_avoir', 15, 2)->default(0)->after('date_remboursement');
            });
        }
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
