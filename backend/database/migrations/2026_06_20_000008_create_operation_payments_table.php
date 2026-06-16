<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('operation_payments')) return;

        Schema::create('operation_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('operation_id');
            $table->date('date_paiement');
            $table->unsignedBigInteger('montant_fcfa')->default(0);
            $table->string('mode', 30); // especes|virement|cheque|mobile_money|autre
            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('operation_id')->references('id')->on('operations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_payments');
    }
};
