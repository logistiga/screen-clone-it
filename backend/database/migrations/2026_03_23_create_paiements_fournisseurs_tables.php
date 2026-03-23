<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements_fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->string('fournisseur');
            $table->string('reference', 100);
            $table->text('description')->nullable();
            $table->decimal('montant_total', 14, 2);
            $table->date('date_facture');
            $table->string('source', 50)->nullable()->comment('GARAGE, OPS, CNV, HORSLBV, MANUEL');
            $table->string('source_id', 100)->nullable()->comment('ID source externe');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('fournisseur');
            $table->index('reference');
        });

        Schema::create('tranches_paiement_fournisseur', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('paiement_fournisseur_id');
            $table->decimal('montant', 14, 2);
            $table->string('mode_paiement', 30);
            $table->string('reference', 100)->nullable();
            $table->text('notes')->nullable();
            $table->date('date_paiement');
            $table->integer('numero_tranche')->default(1);
            $table->unsignedBigInteger('mouvement_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('paiement_fournisseur_id')
                ->references('id')
                ->on('paiements_fournisseurs')
                ->onDelete('cascade');

            $table->index('paiement_fournisseur_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tranches_paiement_fournisseur');
        Schema::dropIfExists('paiements_fournisseurs');
    }
};
